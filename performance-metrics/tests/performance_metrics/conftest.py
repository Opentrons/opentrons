from pathlib import Path


def verify_metrics_store_file(file_path: Path, expected_length: int) -> None:
    """Verify that the metrics store file contains the expected number of lines."""
    with open(file_path, "r") as f:
        stored_data = f.readlines()
        stored_data = [line.strip() for line in stored_data if line.strip()]
        assert len(stored_data) == expected_length
        for line in stored_data:
            state_id, start_time, duration = line.strip().split(",")
            assert state_id.isdigit()
            assert start_time.isdigit()
            assert duration.isdigit()