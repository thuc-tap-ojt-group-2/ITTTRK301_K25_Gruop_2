from datetime import datetime
from pathlib import Path

import pymysql
from sqlalchemy import inspect, text

from app.database import DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER, engine


BACKUP_DIR = Path(__file__).resolve().parent.parent / "backups"


def quote_sql_value(value):
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("\\", "\\\\").replace("'", "''") + "'"


def create_backup():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = BACKUP_DIR / f"library_backup_before_book_metadata_{stamp}.sql"
    connection = pymysql.connect(
        host=DB_HOST, port=int(DB_PORT), user=DB_USER,
        password=DB_PASSWORD, database=DB_NAME,
        charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor,
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            table_names = [next(iter(row.values())) for row in cursor.fetchall()]
            with backup_path.open("w", encoding="utf-8") as backup:
                backup.write("-- PTIT Library backup before book metadata migration\n")
                backup.write(f"-- Created: {datetime.now().isoformat(timespec='seconds')}\n\n")
                backup.write("SET FOREIGN_KEY_CHECKS=0;\n")
                for table_name in table_names:
                    cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
                    create_row = cursor.fetchone()
                    backup.write(f"\nDROP TABLE IF EXISTS `{table_name}`;\n")
                    backup.write(create_row["Create Table"] + ";\n")
                    cursor.execute(f"SELECT * FROM `{table_name}`")
                    rows = cursor.fetchall()
                    if not rows:
                        continue
                    columns = list(rows[0].keys())
                    column_sql = ", ".join(f"`{column}`" for column in columns)
                    for row in rows:
                        value_sql = ", ".join(quote_sql_value(row[column]) for column in columns)
                        backup.write(f"INSERT INTO `{table_name}` ({column_sql}) VALUES ({value_sql});\n")
                backup.write("\nSET FOREIGN_KEY_CHECKS=1;\n")
    finally:
        connection.close()
    if backup_path.stat().st_size == 0:
        backup_path.unlink()
        raise RuntimeError("Backup file is empty")
    return backup_path


def main():
    backup_path = create_backup()
    inspector = inspect(engine)
    columns = {item["name"] for item in inspector.get_columns("books")}
    definitions = {
        "isbn": "VARCHAR(20) NULL",
        "publisher": "VARCHAR(150) NULL",
        "publication_year": "INT NULL",
        "description": "TEXT NULL",
    }
    with engine.begin() as connection:
        for column, definition in definitions.items():
            if column not in columns:
                connection.execute(text(
                    f"ALTER TABLE `books` ADD COLUMN `{column}` {definition}"
                ))
    print("BACKUP_CREATED=" + str(backup_path))
    print("MIGRATION_COMPLETED=book_metadata")


if __name__ == "__main__":
    main()
