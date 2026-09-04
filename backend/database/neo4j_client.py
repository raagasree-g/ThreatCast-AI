import os
from neo4j import GraphDatabase


NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")


if not NEO4J_PASSWORD:
    raise RuntimeError(
        "NEO4J_PASSWORD environment variable is not set."
    )


_driver = GraphDatabase.driver(
    NEO4J_URI,
    auth=(NEO4J_USERNAME, NEO4J_PASSWORD),
)


def verify_connection():
    """Verify that FastAPI can connect to Neo4j."""
    _driver.verify_connectivity()
    return True


def get_driver():
    """Return the shared Neo4j driver."""
    return _driver


def get_database():
    """Return the configured Neo4j database name."""
    return NEO4J_DATABASE


def close_driver():
    """Close the Neo4j driver."""
    _driver.close()