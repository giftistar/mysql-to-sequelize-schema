# mysql-to-sequelize-schema

디비에 있는 테이블을 스키마 구조로 만들어주는 프로젝트 입니다.

## 실행

<code>npm install</code> <br>
<code>npm run start</code> <br>

환경변수 파일이 필요합니다.

.env

<code>
DB_MASTER_HOST=database_address
DB_MASTER_USER=database_user_name
DB_MASTER_PASSWORD=database_user
DB_MASTER_PORT=database_port
DB_MASTER_DATABASE=database
TARGET_FOLDER_PATH=schema_generating_folder
RESULT_FILE_PATH=generate_result_file_path
POSTFIX_SCHEMA_NAME="Schema"
POSTFIX_RETURN_SCHEMA_NAME="Select"
PREFIX_RETURN_SCHEMA_NAME="ReturnSchema"
PREFIX_INPUT_SCHEMA_NAME="Input"
POSTFIX_INPUT_SCHEMA_NAME="Schema"
</code>
