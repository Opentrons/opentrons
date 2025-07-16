# tools

## plot

A server that runs on the OT2, and serves a simple webpage which plots real-time scale data using `plotly`.

Usage (while SSH'ed onto an OT2):

```shell
python -m hardware_testing.tools.plot --test-name gravimetric-rnd --port 8080
```

Then navigate your computer's web browser to that port on the OT2 IP address.


## usb-package

The usb-package bundles up the hardware_testing module so it can run from a usb thumbdrive on the Flex.

Usage:
See [readme.txt](./usb-package/readme.txt) for usage


## flex-diagnostics

Diagnostics script to gather data from the Flex robot from a host computer.

Usage:
See [readme.md](./flex-diagnostics/readme.md) for usage


## tof-analysis

Tools to analyze TOF sensor (TMF88xx) histogram data and generate new baselines

Usage:
See [README.md](./tof-analysis/README.md) for usage
