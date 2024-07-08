"""System resource tracker."""

import logging
import time
from ._logging_config import log_init
from ._config import SystemResourceTrackerConfiguration
from ._system_resource_tracker import SystemResourceTracker

log_init()
logger = logging.getLogger(__name__)

log_level = SystemResourceTrackerConfiguration.parse_logging_level()

if log_level is not None:
    logger.setLevel(log_level)


if __name__ == "__main__":
    logger.info("Starting system resource tracker...")
    config = SystemResourceTrackerConfiguration()
    tracker = SystemResourceTracker(config)

    try:
        while True:
            refreshed_config = SystemResourceTrackerConfiguration.from_env()

            if tracker.config.logging_level_update_needed(refreshed_config):
                logger.setLevel(refreshed_config.logging_level)

            tracker.update_changes_to_config(refreshed_config)
            tracker.get_and_store_system_data_snapshots()
            time.sleep(tracker.config.refresh_interval)
    except KeyboardInterrupt:
        logger.info("Manually stopped.")
    except Exception:
        logger.error("Exception occurred: ", exc_info=True)
    finally:
        logger.info("System resource tracker is stopping.")
