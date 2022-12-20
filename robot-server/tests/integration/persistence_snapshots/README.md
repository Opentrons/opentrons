# Overview

This directory has examples of what a real robot might have in its `robot-server` persistence directory. (See the environment variable `OT_ROBOT_SERVER_persistence_directory` for background.)

These help with testing schema migration and backwards compatibility.

## Snapshot notes

### v6.0.1

This snapshot comes from a v6.0.1 dev server (run with `make -C robot-server dev`).

It includes these protocols, which were uploaded by manually issuing HTTP `POST` requests:

- [simpleV6.json](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/shared-data/protocol/fixtures/6/simpleV6.json)
- [multipleTipracksWithTC.json](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/shared-data/protocol/fixtures/6/multipleTipracksWithTC.json)
- [tempAndMagModuleCommands.json](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/shared-data/protocol/fixtures/6/tempAndMagModuleCommands.json)
- [swift_smoke.py](https://github.com/Opentrons/opentrons/blob/4f9c72ab076692a377afc7245e857385935763a8/g-code-testing/g_code_test_data/protocol/protocols/slow/swift_smoke.py)

The JSON protocols were chosen to cover a wide breadth of Protocol Engine commands.

Each protocol has one completed analysis and one successful run. multipleTipracksWithTC.json also has one failed run from a mismatched pipette error.

### v6.1.0

This snapshot comes from v6.1.0 on a real non-refresh robot. The robot was restarted following the successful execution of both protocols.

The 2 protocols are to provide basic coverage of a python and json protocol. Each protocol has 1 successful analysis and run.

### v6.2.0

This snapshot comes from v6.2.0 on a real non-refresh robot. The robot was restarted following the successful execution of both protocols.

The 2 protocols are to provide basic coverage of a python and json protocol. Each protocol has 1 successful analysis and run.

**NOTE** this db will cause a downgrade migration issue if loaded on a robot with 6.1. The error in the logs does not make it clear but an issue would be expected as there is a module in the DB not released until 6.2 (Thermocycler gen 2)

```shell
Dec 20 12:42:44 JOSH_SET_ME opentrons-api[231]: BEGIN (implicit)
Dec 20 12:42:44 JOSH_SET_ME opentrons-api[231]: SELECT run.state_summary
                                                FROM run
                                                WHERE run.id = ?
Dec 20 12:42:44 JOSH_SET_ME opentrons-api[231]: [cached since 203.8s ago] ('199b991d-db3c-49ff-9b4f-905118c10685',)
Dec 20 12:42:44 JOSH_SET_ME opentrons-api[231]: ROLLBACK
Dec 20 12:42:44 JOSH_SET_ME opentrons-api[231]: Error response: 500 - LegacyError -
Dec 20 12:42:44 JOSH_SET_ME uvicorn[231]: INFO:      - "GET /runs HTTP/1.1" 500 Internal Server Error
Dec 20 12:42:44 JOSH_SET_ME opentrons-api[231]: Exception in ASGI application
                                                Traceback (most recent call last):
                                                  File "usr/lib/python3.7/site-packages/uvicorn/protocols/http/httptools_impl.py", line 371, in run_asgi
                                                  File "usr/lib/python3.7/site-packages/uvicorn/middleware/proxy_headers.py", line 59, in __call__
                                                  File "usr/lib/python3.7/site-packages/fastapi/applications.py", line 208, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/applications.py", line 112, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/middleware/errors.py", line 181, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/middleware/errors.py", line 159, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/middleware/cors.py", line 78, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/exceptions.py", line 82, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/exceptions.py", line 71, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/routing.py", line 580, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/routing.py", line 241, in handle
                                                  File "usr/lib/python3.7/site-packages/starlette/routing.py", line 52, in app
                                                  File "usr/lib/python3.7/site-packages/fastapi/routing.py", line 227, in app
                                                  File "usr/lib/python3.7/site-packages/fastapi/routing.py", line 159, in run_endpoint_function
                                                  File "usr/lib/python3.7/site-packages/robot_server/runs/router/base_router.py", line 195, in get_runs
                                                  File "usr/lib/python3.7/site-packages/robot_server/runs/run_data_manager.py", line 161, in get_all
                                                  File "usr/lib/python3.7/site-packages/robot_server/runs/run_data_manager.py", line 161, in <listcomp>
                                                  File "usr/lib/python3.7/site-packages/robot_server/runs/run_data_manager.py", line 278, in _get_state_summary
                                                  File "usr/lib/python3.7/site-packages/robot_server/runs/run_store.py", line 253, in get_state_summary
                                                  File "usr/lib/python3.7/site-packages/sqlalchemy/engine/result.py", line 1192, in one
                                                  File "usr/lib/python3.7/site-packages/sqlalchemy/engine/result.py", line 575, in _only_one_row
                                                  File "usr/lib/python3.7/site-packages/sqlalchemy/sql/sqltypes.py", line 1887, in process
                                                AttributeError: Can't get attribute 'PipetteNameType' on <module 'opentrons_shared_data.pipette.dev_types' from '/usr/lib/python3.7/site-packages/opentrons_shared_data/pipette/dev_types.pyc'>
Dec 20 12:42:44 JOSH_SET_ME uvicorn[231]: INFO:      - "GET /modules HTTP/1.1" 200 OK
Dec 20 12:42:45 JOSH_SET_ME opentrons-api[231]: BEGIN (implicit)
Dec 20 12:42:45 JOSH_SET_ME opentrons-api[231]: SELECT run.state_summary
                                                FROM run
                                                WHERE run.id = ?
Dec 20 12:42:45 JOSH_SET_ME opentrons-api[231]: [cached since 204.8s ago] ('199b991d-db3c-49ff-9b4f-905118c10685',)
Dec 20 12:42:45 JOSH_SET_ME opentrons-api[231]: ROLLBACK
Dec 20 12:42:45 JOSH_SET_ME opentrons-api[231]: Error response: 500 - LegacyError -
Dec 20 12:42:45 JOSH_SET_ME uvicorn[231]: INFO:      - "GET /runs HTTP/1.1" 500 Internal Server Error
Dec 20 12:42:45 JOSH_SET_ME opentrons-api[231]: Exception in ASGI application
                                                Traceback (most recent call last):
                                                  File "usr/lib/python3.7/site-packages/uvicorn/protocols/http/httptools_impl.py", line 371, in run_asgi
                                                  File "usr/lib/python3.7/site-packages/uvicorn/middleware/proxy_headers.py", line 59, in __call__
                                                  File "usr/lib/python3.7/site-packages/fastapi/applications.py", line 208, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/applications.py", line 112, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/middleware/errors.py", line 181, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/middleware/errors.py", line 159, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/middleware/cors.py", line 78, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/exceptions.py", line 82, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/exceptions.py", line 71, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/routing.py", line 580, in __call__
                                                  File "usr/lib/python3.7/site-packages/starlette/routing.py", line 241, in handle
                                                  File "usr/lib/python3.7/site-packages/starlette/routing.py", line 52, in app
                                                  File "usr/lib/python3.7/site-packages/fastapi/routing.py", line 227, in app
                                                  File "usr/lib/python3.7/site-packages/fastapi/routing.py", line 159, in run_endpoint_function
                                                  File "usr/lib/python3.7/site-packages/robot_server/runs/router/base_router.py", line 195, in get_runs
                                                  File "usr/lib/python3.7/site-packages/robot_server/runs/run_data_manager.py", line 161, in get_all
                                                  File "usr/lib/python3.7/site-packages/robot_server/runs/run_data_manager.py", line 161, in <listcomp>
                                                  File "usr/lib/python3.7/site-packages/robot_server/runs/run_data_manager.py", line 278, in _get_state_summary
                                                  File "usr/lib/python3.7/site-packages/robot_server/runs/run_store.py", line 253, in get_state_summary
                                                  File "usr/lib/python3.7/site-packages/sqlalchemy/engine/result.py", line 1192, in one
                                                  File "usr/lib/python3.7/site-packages/sqlalchemy/engine/result.py", line 575, in _only_one_row
                                                  File "usr/lib/python3.7/site-packages/sqlalchemy/sql/sqltypes.py", line 1887, in process
                                                AttributeError: Can't get attribute 'PipetteNameType' on <module 'opentrons_shared_data.pipette.dev_types' from '/usr/lib/python3.7/site-packages/opentrons_shared_data/pipette/dev_types.pyc'>
Dec 20 12:42:46 JOSH_SET_ME uvicorn[231]: INFO:      - "GET /sessions HTTP/1.1" 200 OK
Dec 20 12:42:46 JOSH_SET_ME uvicorn[231]: INFO:      - "GET /robot/lights HTTP/1.1" 200 OK
Dec 20 12:42:46 JOSH_SET_ME uvicorn[231]: INFO:      - "GET /calibration/status HTTP/1.1
```

### corrupt

Contains an invalid SQLite database file, to simulate a database that's been corrupted.
