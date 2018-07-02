# Update server design review

## Problem

Currently, update endpoint is in API server, and it does not do any safety 
checking to ensure that the newly installed version will be able to come up
and accept successive updates. In this scenario, the API can go down
unrecoverably and require difficult intervention from engineering to get
the robot back online.


## Proposed solution

Create a separate server that will handle updates of SW, FW, and configs.

This server needs to:
- report current versions of all relevant software installed on the robot
  - minimally: self, API server, Smoothie FW
  - optionally: module FW, Python, ResinOS, Docker container (as available)
- accept updates to itself and install them safely. When it gets an update:
  - Create a virtual environment
  - Install the update into the virtual environment
  - Start the server on another port
  - Test the `health` and self-update endpoints in the new server (be 
        careful here about recursion)
  - Check test status. If success, install over top of self and restart. 
        If failure, report status and delete virtual environment
- accept updates to the API server and install them (safety checks optional 
        for now)
- accept updates to Smoothie and module FW and install them (safety checks 
        optional for now)
- provide other endpoints for modifying configurations such as feature-flags 
        and robot configs

For backward compatibility, core update endpoints must also be supported in 
the API server, in case the update server is not present. Shared 
implementations should live in "api-server-lib". Imports of `opentrons`
should be limited, and wrapped in a `try...except` block with graceful
failure (in general, all care should be taken to ensure that this server
*can not* fail in its core task: bootstrapping itself from any prior
version).

Steps for manually testing (warning: this can modify your system install of `otupdate`):
- run `make dev` with the "version" in package.json unchanged (this starts the update server on http://127.0.0.1:34000)
- change "version" to a different value and `make wheel` in another terminal
- use Postman or curl to check the health endpoint
  - with curl: `curl http://127.0.0.1:34000/server/update/health`
  - result should be a json packet including the server name and versions for update server, API server, and Smoothie
- use Postman or curl to send the new wheel to the bootstrap endpoint
  - with curl: `curl -X POST -H "Content-Type: multipart/form-data" -F "whl=@/path/to/otupdate-<version>.whl" http://127.0.0.1:34000/server/update/bootstrap`
  - this will take a while, but it should eventually return a success message and then the installed version of update server on your system should be the new version string

