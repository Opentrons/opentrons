"""Data example."""
from hardware_testing import data


def _main() -> None:
    test_name = "my-test"
    run_id = data.create_run_id()  # automatically will be unique per test run
    tag = "P1KSV3320220721"  # pipette serial number

    # create
    file_name = data.create_file_name(test_name, run_id, tag)
    # write
    data.dump_data_to_file(
        test_name,
        run_id,
        file_name,
        "some,data,to,record\ncan,be,entire,file,at,once\n",
    )
    # append
    data.append_data_to_file(
        test_name,
        run_id,
        file_name,
        "or,you,can,continue,appending,new,data\n",
    )


if __name__ == "__main__":
    _main()
