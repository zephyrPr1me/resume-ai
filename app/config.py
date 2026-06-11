import logging
from os import getenv

from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
API_KEY = getenv("OPENROUTER_API_KEY")
