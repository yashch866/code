from mysql.connector import connect, Error
from contextlib import contextmanager

# IMPORTANT: ALWAYS USE THESE CREDENTIALS:
# Database: code_submission_db
# Username: codeuser
# Password: code123
db_config = {
    "host": "localhost",
    "user": "codeuser",
    "password": "code123",
    "database": "code_submission_db"
}

@contextmanager
def get_db():
    """Get a database connection with automatic resource management"""
    conn = None
    cursor = None
    try:
        conn = connect(**db_config)
        cursor = conn.cursor(dictionary=True, buffered=True)
        yield conn, cursor
    except Error as e:
        print(f"Database error: {e}")
        raise e
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

def test_connection():
    """Test database connection"""
    try:
        with get_db() as (conn, cursor):
            cursor.execute("SELECT 1")
            print("Database connection successful!")
            return True
    except Error as e:
        print(f"Connection failed: {e}")
        return False

# Add this if you want to test the connection when running this file directly
if __name__ == "__main__":
    test_connection()