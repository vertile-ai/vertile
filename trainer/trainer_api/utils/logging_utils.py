import json
import logging
import sys
from io import StringIO
from typing import Callable, TextIO, Optional, Union


# Custom class to intercept stdout
class StdoutInterceptor:
    def __init__(self, logger_name):
        self.original_stdout = sys.stdout  # Save the original stdout
        self.buffer = StringIO()
        self.logger_name = logger_name

    def write(self, message):
        self.original_stdout.write(f"{self.logger_name}:\n{message}\n")  # Custom action
        self.buffer.write(message)  # Save the original message

    def flush(self):
        self.original_stdout.flush()
        self.buffer.flush()

    def get_value(self):
        return self.buffer.getvalue()


def get_stream_logger(name: str, level=logging.INFO):
    # Create a custom logger
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Create handlers (console handler in this example)
    ch = logging.StreamHandler(sys.stdout)
    ch.setLevel(level)

    # Create formatter with the custom prefix
    formatter = logging.Formatter(f"[{name}] %(asctime)s - %(levelname)s - %(message)s")

    # Add the formatter to the handler
    ch.setFormatter(formatter)

    # Add the handler to the logger
    logger.addHandler(ch)

    return logger


def log_and_print(
    logger: logging.Logger,
    log_file: Optional[TextIO],
    message: str,
    level: str = "info",
):
    """
    Helper function to both log to file and print to console

    Args:
        logger: The logger instance to use
        log_file: File object to write to (can be None)
        message: The message to log
        level: Log level (info, warning, error, debug)
    """
    # Log to the logger
    if level.lower() == "info":
        logger.info(message)
    elif level.lower() == "warning":
        logger.warning(message)
    elif level.lower() == "error":
        logger.error(message)
    elif level.lower() == "debug":
        logger.debug(message)

    # Write to the log file if provided
    if log_file:
        log_file.write(f"{message}\n")
        log_file.flush()  # Ensure the log is written immediately
