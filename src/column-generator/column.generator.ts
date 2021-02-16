

import { config } from '../config/config'
import * as fs from 'fs';
import { Desc } from '../types';
const mysql = require('mysql');
const util = require('util');


export const pool = mysql.createPool(config);
pool.query = util.promisify(pool.query);
pool.getConnection = util.promisify(pool.getConnection);




class ColumnGenerator {
    //

    target_fields = [
        {
            name: 'resigt_user_idx',
            type: 'int(11)',
            nullable: true
        },
        {
            name: 'update_user_idx',
            type: 'int(11)',
            nullable: true
        },
        {
            name: 'channel_code',
            type: 'varchar(10)',
            nullable: false,
            extra : 'default "giftistar"'
        },
        {
            name: 'regist_datetime',
            type: 'datetime',
            nullable: true,
            extra: 'DEFAULT CURRENT_TIMESTAMP'
        },
        {
            name: 'update_datetime',
            type: 'datetime',
            nullable: true,
            extra: 'DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        },
    ]

    constructor(private opt: {
        exclude_table_list: string[]
    }) {
        this.init()
    }



    async init() {

        // 테이블 네임 추출해주기
        const result: any = await pool.query('show tables', [])
        for (let item in result) {
            let table_name = result[item][`Tables_in_${config.database}`];
            if (this.opt.exclude_table_list.includes(table_name)) {

            } else {
                await this.scan_table_and_add_column(table_name)
            }
        }



        process.exit()
    }



    async scan_table_and_add_column(table_name) {
        console.log(`start ${table_name} scan...`)
        const desc: Desc[] = await pool.query(`show full columns from ${table_name}`, [])

        for (let t_field of this.target_fields) {
            let found_result = desc.findIndex(_ => {
                return _.Field == t_field.name
            })

            if (found_result == -1) {
                console.log(`add ${t_field.name} to ${table_name}....`)
                await pool.query(`alter table ${table_name} add ${t_field.name} ${t_field.type} ${t_field.nullable ? '' : 'not null'} ${t_field.extra ? t_field.extra : ''}`)
            }
        }

        console.log(`done`)
    }



}


new ColumnGenerator({
    exclude_table_list: ['user', 'order_lis']
});