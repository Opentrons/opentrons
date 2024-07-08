"""System resource tracker."""

import logging
import time
from ._logging_config import log_init
from ._config import SystemResourceTrackerConfiguration, EnvironmentParseError
from ._system_resource_tracker import SystemResourceTracker

log_init()
logger = logging.getLogger(__name__)


if __name__ == "__main__":
    try:
        config = SystemResourceTrackerConfiguration.from_env()
    except EnvironmentParseError:
        logger.error(
            "Failed to parse set environment variables successfully. Exiting...",
            exc_info=True,
        )
        exit(1)
    except Exception:
        logger.error("Unexpected exception occurred. Exiting...", exc_info=True)
        exit(1)

    logger.info(f"Running with the following configuration: {config}")

    logger.setLevel(config.logging_level)

    tracker = SystemResourceTracker(config)

    logger.info("Starting system resource tracker...")
    try:
        while True:

            tracker.get_and_store_system_data_snapshots()
            time.sleep(tracker.config.refresh_interval)
    except KeyboardInterrupt:
        logger.info("Manually stopped.")
    except Exception:
        logger.error("Exception occurred: ", exc_info=True)
    finally:
        logger.info("System resource tracker is stopping.")
