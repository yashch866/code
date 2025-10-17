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
    "database": "code_submission_db",
    "raise_on_warnings": True,
    "connection_timeout": 5
}

@contextmanager
def get_db():
    """Get a database connection with automatic resource management"""
    conn = None
    cursor = None
    try:
        conn = connect(**db_config)
        if not conn.is_connected():
            raise Error("Failed to establish connection")
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
            result = cursor.fetchone()
            if result:
                print("Database connection successful!")
                # Try to verify manual_tests table
                try:
                    cursor.execute("SELECT COUNT(*) FROM manual_tests")
                    count = cursor.fetchone()
                    print(f"Number of records in manual_tests table: {count['COUNT(*)'] if count else 0}")
                except Error as e:
                    print(f"Could not query manual_tests table: {e}")
            return True
    except Error as e:
        print(f"Connection failed: {e}")
        return False

# Add this if you want to test the connection when running this file directly
if __name__ == "__main__":
    test_connection()