# logging_config.py
import logging

from pythonjsonlogger import jsonlogger

from api.settings import Settings

FORMAT = (
    "%(asctime)s %(levelname)s [%(name)s] [%(filename)s:%(lineno)d] "
    "[dd.service=%(dd.service)s dd.env=%(dd.env)s dd.version=%(dd.version)s dd.trace_id=%(dd.trace_id)s dd.span_id=%(dd.span_id)s] "
    "- %(message)s"
)

LOCAL_FORMAT = "%(asctime)s %(levelname)s [%(name)s] [%(filename)s:%(lineno)d] - %(message)s"


def setup_logging() -> None:
    settings = Settings()
    log_handler = logging.StreamHandler()

    if settings.environment == "local":
        formatter = logging.Formatter(LOCAL_FORMAT)
    else:
        formatter = jsonlogger.JsonFormatter(FORMAT)  # type: ignore

    log_handler.setFormatter(formatter)

    logging.basicConfig(
        level=settings.log_level.upper(),
        handlers=[log_handler],
    )


# Call this function to initialize logging
setup_logging()


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
