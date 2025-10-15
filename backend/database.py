from mysql.connector import connect, Error
from mysql.connector.pooling import MySQLConnectionPool
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
    "pool_name": "mypool",
    "pool_size": 5
}

try:
    connection_pool = MySQLConnectionPool(**db_config)
except Error as e:
    print(f"Error connecting to MySQL: {e}")
    raise e

@contextmanager
def get_db():
    """Get a database connection from the pool with automatic resource management"""
    connection = connection_pool.get_connection()
    cursor = None
    try:
        cursor = connection.cursor(dictionary=True)
        yield connection, cursor
    except Exception as e:
        if connection.is_connected():
            connection.rollback()
        print(f"Database error: {e}")
        raise e
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

def test_connection():
    """Test database connection and print status"""
    try:
        with get_db() as (connection, cursor):
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            print("Database connection successful!")
            return True
    except Error as e:
        print(f"Connection failed: {e}")
        return False

# Add this if you want to test the connection when running this file directly
if __name__ == "__main__":
    test_connection()