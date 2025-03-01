import logging
import sys
from logging.handlers import RotatingFileHandler
import os

class LoggerService:
    _instance = None
    _logger = None
    log_file_path = 'logs/watdig_hmi.log'

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LoggerService, cls).__new__(cls)
            cls._setup_logger()
        return cls._instance

    @classmethod
    def _setup_logger(cls):
        """Initialize the logger with both file and console handlers"""
        cls._logger = logging.getLogger('WatdigHMI')
        cls._logger.setLevel(logging.INFO)

        # Create formatters
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

        # Create logs directory if it doesn't exist
        log_dir = os.path.dirname(cls.log_file_path)
        os.makedirs(log_dir, exist_ok=True)

        # Create and setup file handler (with rotation)
        file_handler = RotatingFileHandler(
            cls.log_file_path,
            maxBytes=10485760,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(logging.INFO)

        # Create and setup console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        console_handler.setLevel(logging.INFO)

        # Add handlers to logger
        cls._logger.addHandler(file_handler)
        cls._logger.addHandler(console_handler)

    @classmethod
    def get_logger(cls):
        """Get the logger instance"""
        if cls._logger is None:
            cls._setup_logger()
        return cls._logger

# Create convenient functions for different log levels
def info(message):
    LoggerService.get_logger().info(message)

def error(message):
    LoggerService.get_logger().error(message)

def warning(message):
    LoggerService.get_logger().warning(message)

def debug(message):
    LoggerService.get_logger().debug(message)

def critical(message):
    LoggerService.get_logger().critical(message)
