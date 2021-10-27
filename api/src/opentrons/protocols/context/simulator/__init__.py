"""Context simulation.

One way of simulating a Protocol API v2 protocol (e.g. to detect equipment requirements)
is to simulate at the level of the hardware API. However, this is slow.

To speed things up, these classes can additionally take the place of a
Protocol API v2 context's implementation, to simulate certain things at the level of
the Protocol API, avoiding certain calls to the underlying hardware API.
"""
