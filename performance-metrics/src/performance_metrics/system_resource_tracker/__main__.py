"""System resource tracker."""

import logging
import time
from ._logging_config import log_init
from ._config import SystemResourceTrackerConfiguration
from ._system_resource_tracker import _SystemResourceTracker

log_init()
logger = logging.getLogger(__name__)

log_level = SystemResourceTrackerConfiguration.parse_logging_level()

if log_level is not None:
    logger.setLevel(log_level)


if __name__ == "__main__":
    logger.info("Starting system resource tracker...")
    config = SystemResourceTrackerConfiguration()
    tracker = _SystemResourceTracker(config)

    try:
        while True:
            refreshed_config = SystemResourceTrackerConfiguration.from_env()

            if tracker.config.logging_level_update_needed(refreshed_config):
                logger.setLevel(refreshed_config.logging_level)

            tracker.update_changes_to_config(refreshed_config)
            tracker.get_and_store_system_data_snapshots()

            time.sleep(tracker.config.refresh_interval)
    except Exception as e:
        logger.error("Exception occurred: %s", str(e))
    finally:
        logger.info("System resource tracker is stopping.")
