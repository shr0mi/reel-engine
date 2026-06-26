# db.py
# Simple SQLite helper for local persistence of the single brand profile row.
import os
import sqlite3
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "brand_profile.db")


@contextmanager
def get_db():
    """Yields a (conn, cur) pair and commits/closes automatically."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.cursor()
        yield conn, cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Create the brand_profiles table and seed the default id=1 row."""
    with get_db() as (conn, cur):
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS brand_profiles (
                id INTEGER PRIMARY KEY,
                brand_prompt TEXT,
                brand_name TEXT,
                what_brand_does TEXT,
                who_are_customers TEXT,
                what_customers_like TEXT
            )
            """
        )
        # Seed the single profile row so the router's "always operate on id=1"
        # assumption holds even on a brand-new database.
        cur.execute(
            "INSERT OR IGNORE INTO brand_profiles (id) VALUES (1)"
        )


# Ensure schema exists at import time.
init_db()
