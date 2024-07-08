"""System resource tracker."""

import logging
import time
from pathlib import Path
from ._logging_config import log_init
from ._system_resource_tracker import SystemResourceTracker

log_init()
logger = logging.getLogger(__name__)


if __name__ == "__main__":
    logger.info("Starting system resource tracker...")
    tracker = SystemResourceTracker(
        storage_dir=Path("/data/performance_metrics_data"),
        process_filters=("/opt/opentrons*", "python3*"),
        should_track=True,
        refresh_interval=5,
    )

    try:
        while True:
            tracker.get_and_store_system_data_snapshots()
            time.sleep(tracker.refresh_interval)
    except KeyboardInterrupt:
        logger.info("Manually stopped.")
    except Exception:
        logger.error("Exception occurred: ", exc_info=True)
    finally:
        logger.info("System resource tracker is stopping.")
