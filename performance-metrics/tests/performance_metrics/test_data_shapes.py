"""Tests for the data shapes."""

from performance_metrics._data_shapes import ProcessResourceUsageSnapshot


def test_headers_ordering() -> None:
    """Tests that the headers are in the correct order."""
    assert ProcessResourceUsageSnapshot.headers() == (
        "query_time",
        "command",
        "running_since",
        "user_cpu_time",
        "system_cpu_time",
        "memory_percent",
    )


def test_csv_row_method_ordering() -> None:
    """Tests that the CSV row method returns the correct order."""
    expected = (
        1,
        "test",
        2,
        3,
        4,
        5,
    )

    assert (
        ProcessResourceUsageSnapshot(
            query_time=1,
            command="test",
            running_since=2,
            user_cpu_time=3,
            system_cpu_time=4,
            memory_percent=5,
        ).csv_row()
        == expected
    )

    assert (
        ProcessResourceUsageSnapshot(
            command="test",
            query_time=1,
            user_cpu_time=3,
            system_cpu_time=4,
            running_since=2,
            memory_percent=5,
        ).csv_row()
        == expected
    )

    assert (
        ProcessResourceUsageSnapshot.from_csv_row(
            (
                1,
                "test",
                2,
                3,
                4,
                5,
            )
        ).csv_row()
        == expected
    )
