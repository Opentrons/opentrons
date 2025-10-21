"""Maintenance Run creation and management.

A "run" is a logical container for a user's interaction with a robot,
usually (but not always) with a well-defined start point and end point.

A maintenance run is a special type of run that is used for running
maintenance procedures like instrument attach/detach/calibration and LPC.
A maintenance run doesn't have a protocol associated with it, but is issued individual
commands and actions over HTTP.
"""
