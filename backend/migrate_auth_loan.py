from sqlalchemy import inspect, text

from app.database import Base, engine
from app import models


def _ensure_column(table: str, column: str, definition: str) -> None:
    columns = {item["name"] for item in inspect(engine).get_columns(table)}
    if column in columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text(f"ALTER TABLE `{table}` ADD COLUMN `{column}` {definition}")
        )


def main() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_column("users", "is_locked", "BOOLEAN NOT NULL DEFAULT FALSE")
    _ensure_column(
        "loans",
        "created_at",
        "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
    )
    _ensure_column("loans", "extension_count", "INT NOT NULL DEFAULT 0")
    print("AUTH/LOAN schema migration completed.")


if __name__ == "__main__":
    main()
