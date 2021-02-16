import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  connectionLimit: 10,
  host: process.env.DB_MASTER_HOST || 'localhost',
  user: process.env.DB_MASTER_USER || 'root',
  password: process.env.DB_MASTER_PASSWORD || '1234',
  port: Number(process.env.DB_MASTER_PORT || 3306),
  database: process.env.DB_MASTER_DATABASE || 'db',
  dateStrings: true,
  charset: 'utf8mb4',
  target_folder_path: process.env.TARGET_FOLDER_PATH || './result',
  result_file_path: process.env.RESULT_FILE_PATH || './result',
  pre_fix_schema_name: process.env.PREFIX_SCHEMA_NAME || '',
  post_fix_schema_name: process.env.POSTFIX_SCHEMA_NAME || '',
  pre_fix_return_schema_name: process.env.POSTFIX_RETURN_SCHEMA_NAME || '',
  post_fix_return_schema_name: process.env.PREFIX_RETURN_SCHEMA_NAME || '',
  pre_fix_input_schema_name: process.env.PREFIX_INPUT_SCHEMA_NAME || '',
  post_fix_input_schema_name: process.env.POSTFIX_INPUT_SCHEMA_NAME || ''
};
