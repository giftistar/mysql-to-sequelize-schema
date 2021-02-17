import { config } from './config/config';
import * as fs from 'fs';
import { Desc } from './types';
const mysql = require('mysql');
const util = require('util');

export const pool = mysql.createPool(config);
pool.query = util.promisify(pool.query);
pool.getConnection = util.promisify(pool.getConnection);

async function start() {
  const exclude_table_names = ['order_sequence'];
  try {
    // 테이블 네임 추출해주기
    let table_name = [];
    let schema_name_list = [];
    const result: any = await pool.query('show tables', []);

    console.log('result', result);
    for (let item in result) {
      if (
        (result[item][`Tables_in_${config.database}`] as string).startsWith('_') ||
        exclude_table_names.includes(result[item][`Tables_in_${config.database}`] as string)
      ) {
        continue;
      }
      table_name.push(result[item][`Tables_in_${config.database}`] + '.schema.ts');
      let table = result[item][`Tables_in_${config.database}`];
      const table_ = table.split('_');
      let shema_name = '';
      for (let i = 0; i < table_.length; i++) {
        shema_name += table_[i].charAt(0).toUpperCase() + table_[i].substring(1);
      }
      shema_name += config.post_fix_schema_name;
      schema_name_list.push(shema_name);
    }

    const migration_result = {
      update: 0,
      create: 0,
      total: 0
    };
    // // 파일 리스트 가져오기
    let fileList: any = await readFolder(config.target_folder_path);
    for (let i = 0; i < table_name.length; i++) {
      // 이미 만들어져있는 스키마들
      migration_result.total++;
      if (fileList.indexOf(table_name[i]) != -1) {
        migration_result.update++;
        await updateFile(table_name[i]);
      } else {
        migration_result.create++;
        await createFile(table_name[i]);
      }
    }

    // 결과 요약.
    let new_models = `
        //sequelize_models_start
        //total_schema_count: ${migration_result.total}\n
        //create: ${migration_result.create}\n
        //update: ${migration_result.update}\n
        [`;
    for (let i = 0; i < schema_name_list.length; i++) {
      new_models += `\n\t\t\t${schema_name_list[i]}`;
      if (i < schema_name_list.length - 1) {
        new_models += ',';
      }
    }
    new_models += `
        ]
        //sequelize_models_end
        `;

    const result_file_name = new Date() + '_migration.txt';
    fs.writeFileSync(`${config.result_file_path || './result'}/${result_file_name}`, new_models);

    // let sequelize_models_start_index = app_module_source.indexOf('//sequelize_models_start');
    // let sequelize_models_end_index = app_module_source.indexOf('//sequelize_models_end') + '//sequelize_models_end'.length;

    // if (sequelize_models_start_index > -1 && sequelize_models_end_index > -1) {
    //     let new_models = `
    //     //sequelize_models_start
    //     models : [`
    //     for (let schema_name of schema_name_list) {
    //         new_models += `\n\t\t\t${schema_name},`
    //     }
    //     new_models += `],
    //     //sequelize_models_end
    //     `
    //     const new_app_module_source = app_module_source.replace(app_module_source.substring(sequelize_models_start_index, sequelize_models_end_index), new_models);
    //     fs.writeFileSync(`${config.target_app_module_path}`, new_app_module_source)
    // }

    //
    console.log('done migration!!!');
    process.exit(0);
  } catch (err) {
    console.log(err);
  }
}

async function readFolder(folder_path) {
  return new Promise((resolve, reject) => {
    fs.readdir(folder_path, function (err, files) {
      //handling error
      if (err) {
        return console.log('Unable to scan directory: ' + err);
      }

      const list = [];
      //listing all files using forEach
      files.forEach(function (file) {
        // Do whatever you want to do with the file
        // console.log(file);
        if (file.endsWith('.ts')) {
          list.push(file + '');
        }
      });

      resolve(list);
    });
  });
}

async function createFile(table_name) {
  const create_ = await create(table_name);
  const final_result = create_[0].concat('\n', create_[1], '\n \n', create_[2], '\n\n', create_[3], '\n\n', create_[4]);
  // 파일 생성해주기 (경로, 내용)
  fs.writeFileSync(`${config.target_folder_path}/${table_name}`, create_[create_.length - 1].concat(final_result));
}

function findEndLinePosition(source: any, targetKey: string) {
  for (let i = 0; i < source.length; i++) {
    const temp = source[i].trim();
    if (targetKey == temp) {
      return i;
    }
  }
}

async function updateFile(table_path) {
  const create_ = await create(table_path);

  const object_type = create_[2];
  const return_type = create_[3];
  const input_type = create_[4];

  let schema = '';

  const table = table_path.replace('.schema.ts', '');
  const table_ = table.split('_');
  for (let i = 0; i < table_.length; i++) {
    const data = table_[i].charAt(0).toUpperCase() + table_[i].substring(1);
    schema += data;
    console.log(schema);
  }

  const schema_name = config.pre_fix_schema_name + schema + config.post_fix_schema_name;

  const source = fs.readFileSync(`${config.target_folder_path}/${table_path}`, 'utf8');
  const lines = source.split('\n');

  let save_data = '';
  let input_save_data = '';
  // lines.forEach(x=> {console.log('222', x)})
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // object type에서 내가 입력한 앞부분까지만 바꿔주기.
    if (line.startsWith(`//start`)) {
      const data = lines.slice(i);
      // 값 저장하기
      // console.log('data=' + JSON.stringify(data));
      let endLine = findEndLinePosition(data, '//end');
      // console.log('update endLine=' + endLine);

      const save_ = data.splice(0, endLine + 1);

      // console.log('save_', save_);

      for (let j = 0; j < save_.length; j++) {
        let save = save_[j];
        save_data += save + '\n';
      }
    }
    if (line.startsWith(`//input_start`)) {
      console.log('save_1ㄴ', line);
      const data = lines.slice(i);
      // 값 저장하기
      console.log('data=' + JSON.stringify(data));
      let endLine = findEndLinePosition(data, '//input_end');
      console.log('update endLine=' + endLine);

      const save_ = data.splice(0, endLine + 1);

      for (let k = 0; k < save_.length; k++) {
        let save = save_[k];
        input_save_data += save + '\n';
      }
      console.log('input_save_data', input_save_data);
    }
  }

  // 맨 마지막 괄호 제거 해주고 저장한 데이터 붙여주기
  const object = object_type.slice(0, -1);
  const concat = object.concat(save_data, '}');
  let data = source.substring(source.indexOf(`export class ${schema_name} extends Model {`), source.indexOf('//class_end'));
  let input_data = input_type.substring(0, input_type.indexOf('//class_end'));
  input_data = input_data.replace(/\s}\s/, '');
  const input = input_data.concat(input_save_data, '}', '\n\n//class_end');
  const rr = concat.concat('\n\n', return_type, '\n\n', input);

  let middle_result;
  let easy_graphql_comment_start_index = source.indexOf('//easy_graphql_comment_start');
  let easy_graphql_comment_end_index = source.indexOf('//easy_graphql_comment_end') + '//easy_graphql_comment_end'.length;
  if (easy_graphql_comment_start_index > -1 && easy_graphql_comment_start_index > -1) {
    middle_result = source.replace(source.substring(easy_graphql_comment_start_index, easy_graphql_comment_end_index), '');
  } else {
    middle_result = source;
  }
  middle_result = middle_result.replace(/\/\/class_end/g, '');
  const final_result = middle_result.replace('@ObjectType()\n' + data, rr);
  // console.log('final_result' , final_result)
  fs.writeFileSync(`${config.target_folder_path}/${table_path}`, create_[create_.length - 1].concat(final_result));
}

// 생성과 수정에 동시에 사용하는 생성해주는 함수
async function create(table_name) {
  // 1. table_name 에서 schema.ts 빼주기
  // 2. 이제 desc table_name 해주기 여기서부텉 해석 ㄱㄱ

  const table = table_name.replace('.schema.ts', '');
  // const desc: any = await pool.query(`desc ${table}`, [])
  // 2020.08.20 김영태
  // desc 보다 show full columns from이 더 많은 데이터를 반환합니다.
  const desc: Desc[] = await pool.query(`show full columns from \`${table}\``, []);
  console.log('desc test', desc);
  let type;
  let type_split: string;
  let field;
  let text_type;
  let text;
  let result;

  let type_upper: string;
  let type_length;

  let default_value = 'null';
  let test = '';
  let field_result = [];
  let input_result = [];

  let input_value;
  let input_field;

  let easy_graphql_comment = `//easy_graphql_comment_start\n/*\n\t`;

  for (let i = 0; i < desc.length; i++) {
    let type_func;
    easy_graphql_comment += desc[i].Field + '\n\t';
    console.log('===> ', desc[i]);
    // Column
    if (desc[i].Type.indexOf('enum') != -1) {
      type_split = desc[i].Type.substring(0, 4).toUpperCase() + desc[i].Type.substring(4).toLowerCase();
      type_length = null;
    } else if (desc[i].Type.indexOf('decimal') != -1) {
      type_upper = desc[i].Type.toUpperCase();
      const type_ = type_upper.split('(');
      type_split = type_[0];
      type_length = type_[1];
    } else {
      type_upper = desc[i].Type.toUpperCase();
      const type_ = type_upper.split('(');
      type_split = type_[0];
      type_length = type_upper.replace(/[^0-9]/g, '');
    }

    if (type_split == 'VARCHAR') {
      type_split = 'STRING';
    } else if (type_split == 'INT') {
      type_split = 'INTEGER';
    } else if (type_split == 'TIMESTAMP') {
      type_split = 'TIME';
    } else if (type_split == 'DATETIME') {
      type_split = 'DATE';
    } else if (type_split == 'LONGTEXT' || type_split == 'MEDIUMTEXT' || type_split == 'TINYTEXT') {
      type_length = `"${type_split.substring(0, type_split.length - 4).toLowerCase()}"`;
      type_split = 'TEXT';
    }

    if (desc[i].Default) {
      const regexp = /^[0-9]*$/;
      if (!regexp.test(desc[i].Default)) {
        // 숫자
        if (type_split == 'DATE' && desc[i].Default.includes('CURRENT_TIMESTAMP')) {
          default_value = "Sequelize.literal('" + desc[i].Default + "')";
        } else {
          default_value = "'" + desc[i].Default + "'";
        }
      } else {
        default_value = desc[i].Default;
      }
    } else {
      default_value = null;
    }

    let column_decorator_parts: { type_length?: string; default_value?: string; comment?: string } = {
      type_length: '',
      default_value: '',
      comment: ''
    };
    if (type_length) {
      if (type_split == 'DECIMAL') {
        const target_splited = type_length.split(',').map((_) => {
          return _.replace(/[^0-9]/g, '');
        });
        column_decorator_parts.type_length = `({precision: ${target_splited[0]} , scale : ${target_splited[1]} })`;
      } else {
        column_decorator_parts.type_length = `({ length : ${type_length} })`;
      }
    }
    if (default_value) {
      column_decorator_parts.default_value = `, defaultValue : ${default_value}`;
    }

    // if (desc[i].Comment) {
    //     column_decorator_parts.comment = `, comment : "${desc[i].Comment}"`;
    // }

    type = `@Column({type: DataType.${type_split}${column_decorator_parts.type_length} ${column_decorator_parts.default_value} ${column_decorator_parts.comment}})`.trim();

    if ((type_split == 'TINYINT' && type_length > 1) || type_split == 'INTERGER') {
      type_func = '_ => Int ,';
    }
    if (type_split == 'BIGINT') {
      type_func = '_ => BigInt ,';
    } else if (type_split == 'TINYINT' && type_length == 1) {
      type_func = '_ => Boolean ,';
    } else {
    }

    // Field
    field = `\t@Field(${type_func ? type_func : ''}{ nullable: true })`;
    let data = '';

    if (type_split.indexOf('ENUM') != -1) {
      const replace = type_split.replace('ENUM(', '');
      const replace_ = replace.replace(')', '');

      const enum_data = replace_.split(',');

      for (let i = 0; i < enum_data.length; i++) {
        data += enum_data[i] + '|';
      }
      text_type = data.slice(0, -1);
    }

    // text
    if (type_split == 'BIGINT' || type_split == 'INTEGER' || type_split == 'FLOAT' || type_split == 'DECIMAL') {
      text_type = 'number';
    } else if (type_split == 'TINYINT') {
      if (type_length == 4 && desc[i].Field.includes('_status')) {
        if (desc[i].Field == 'cu_status') {
          text_type = 'COUPON_UPLOAD_STATUS';
        } else if (desc[i].Field == 'coupon_status') {
          text_type = 'COUPON_STATUS';
        } else if (desc[i].Field == 'order_list_status') {
          text_type = 'ORDER_LIST_STATUS';
        } else if (desc[i].Field == 'order_coupon_status') {
          text_type = 'ORDER_COUPON_STATUS';
        } else if (desc[i].Field == 'delete_type' && table == 'coupon_upload') {
          text_type = 'COUPON_UPLOAD_DELETE_TYPE';
        } else if (desc[i].Field == 'report_status' || desc[i].Field == 'report_buyer_status' || desc[i].Field == 'report_seller_status') {
          text_type = 'REPORT_STATUS';
        } else if (desc[i].Field == 'resend_order_coupon_status') {
          text_type = 'RESEND_ORDER_COUPN_STATUS';
        } else if (desc[i].Field == 'resend_type') {
          text_type = 'RESEND_TYPE';
        } else if (desc[i].Field == 'bank_transfer_status') {
          text_type = 'BANK_TRANSFER_STATUS';
        } else if (desc[i].Field == 'push_alarm_status') {
          text_type = 'PUSH_ALARM_STATUS';
        } else if (desc[i].Field == 'ai_status') {
          text_type = 'CU_AI_STATUS';
        } else if (desc[i].Field == 'event_coupon_status') {
          text_type = 'EVENT_COUPON_STATUS';
        }
      } else {
        text_type = type_length == 1 ? 'boolean' : 'number';
      }
    } else if (type_split == 'DATE') {
      text_type = 'Date';
    } else if (type_split == 'TEXT' || type_split == 'STRING') {
      text_type = 'string';
    }

    text = `\t${desc[i].Field}?: ${text_type}`;
    input_field = `\t@Field(${type_func ? type_func : ''}{ nullable: true })`;

    input_value = input_field.concat('\n', text, '\n');

    result = '\t'.concat(type, '\n', field, '\n', text, '\n');

    if (desc[i].Extra == 'auto_increment') {
      const add = '\t' + '@AutoIncrement';
      result = add.concat('\n', result);
    }

    if (desc[i].Key == 'PRI') {
      const add = '\t@PrimaryKey';
      result = add.concat('\n', result);
    }

    field_result.push(result);
    input_result.push(input_value);
  }

  const value = field_result.join('\n');
  const input_val = input_result.join('\n');
  console.log(input_val);

  const import_ = `\nimport { Table, AutoIncrement, PrimaryKey, Column, DataType, Sequelize , Model } from "sequelize-typescript";
import { ObjectType, Field, Int, InputType , Float } from "type-graphql";
const BigInt = require('graphql-bigint')
`;

  let schema = '';

  const table_ = table.split('_');
  for (let i = 0; i < table_.length; i++) {
    const data = table_[i].charAt(0).toUpperCase() + table_[i].substring(1);
    schema += data;
    console.log(schema);
  }

  const schema_name = schema + config.post_fix_schema_name;
  const return_schema_name = config.pre_fix_return_schema_name + schema + config.post_fix_return_schema_name;
  const input_name = config.pre_fix_input_schema_name + schema + config.post_fix_input_schema_name;

  const table_data = `@Table({
    timestamps:false,
    tableName: '${table}'
})
    `;
  // 기본적인 object_type
  const object_type = `@ObjectType()
export class ${schema_name} extends Model {
${value}
}`;

  const return_type = `@ObjectType()
export class ${return_schema_name} {
    @Field(type => Int)
    count?: number;

    @Field(type => [${schema_name}])
    rows?: ${schema_name}[];
}    
`;
  const input_type = `@InputType()
export class ${input_name}{
${input_val}
}  

//class_end`;

  easy_graphql_comment += `\n*/\n//easy_graphql_comment_end`;
  const result_ = [import_, table_data, object_type, return_type, input_type, easy_graphql_comment];
  return result_;
}

start();
