# tools

## plot

A server that runs on the OT2, and serves a simple webpage which plots real-time scale data using `plotly`.

Usage (while SSH'ed onto an OT2):

```shell
python -m hardware_testing.tools.plot --test-name gravimetric-rnd --port 8080
```

Then navigate your computer's web browser to that port on the OT2 IP address.
