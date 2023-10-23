```python
from time import time
from hardware_testing import data

metadata = {"apiLevel": "2.13", "protocolName": "aspirate-test"}

test_name = metadata["protocolName"]    # high-level name for this test
run_id = data.create_run_id()           # unique identifier, for this specific test run
tag = f"start-time-{int(time())}"       # eg: device serial number, test start time

# create the file, placing it the `testing_data` folder
file_name = data.create_file_name(test_name=test_name,
                                  run_id=run_id,
                                  tag=tag)
# write entire file contents at once
data.dump_data_to_file(test_name=test_name,
                       run_id=run_id,
                       file_name=file_name,
                       data="some,data,to,record\ncan,be,entire,file,at,once\n")
# optionally, continue to append to that same file
data.append_data_to_file(test_name=test_name,
                         run_id=run_id,
                         file_name=file_name,
                         data="or,you,can,continue,appending,new,data\n")
```
