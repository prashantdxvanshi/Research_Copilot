import os
import logging
from pymongo import MongoClient

logger = logging.getLogger(__name__)

# 1. Fetch connection details from the environment (default to localhost MongoDB)
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "research_copilot")

# 2. Establish connection to the database
try:
    logger.info(f"Connecting to MongoDB at {MONGODB_URI}")
    # client is thread-safe and acts as a connection pool
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    
    # Check if database connection is alive by pinging server info
    client.server_info()
    db = client[MONGODB_DB_NAME]
    logger.info("Successfully connected to MongoDB")
except Exception as e:
    logger.critical(f"Failed to connect to MongoDB: {e}", exc_info=True)
    raise e

# 3. Dependency helper function to yield the database client inside routes
def get_db():
    """
    Dependency injection helper. Yields the MongoDB database instance to FastAPI routes.
    """
    yield db

