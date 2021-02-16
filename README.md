# mysql-to-sequelize-schema

디비에 있는 테이블을 스키마 구조로 만들어주는 프로젝트 입니다.

## 실행

<code>npm install</code> <br>
<code>npm run start</code> <br>

환경변수 파일이 필요합니다.

.env


DB_MASTER_HOST=database_address (디비주소) <br>
DB_MASTER_USER=database_user_name (유저아이디) <br>
DB_MASTER_PASSWORD=database_user (패스워드) <br>
DB_MASTER_PORT=database_port (포트) <br>
DB_MASTER_DATABASE=database (디비) <br>
TARGET_FOLDER_PATH=schema_generating_folder <br>
RESULT_FILE_PATH=generate_result_file_path <br>
POSTFIX_SCHEMA_NAME="Schema" <br>
POSTFIX_RETURN_SCHEMA_NAME="Select" <br>
PREFIX_RETURN_SCHEMA_NAME="ReturnSchema" <br>
PREFIX_INPUT_SCHEMA_NAME="Input" <br>
POSTFIX_INPUT_SCHEMA_NAME="Schema" <br>

