# OpenTrons Labware Library

The point of this repository is to provide a software equivalent to
an operating OpenTrons machine, including all related deck modules
and instruments (pipettes, tipracks, microplates, etc).

This current version has basic support for keeping track of liquids (and 
mixtures of liquids) between liquid containers.

Later versions will build upon this to provide an interface for Protocol
design that will enable us to build extremely user-friendly interfaces
that can translate user goals to an optimized list of actions.

It will also allow us to do error checking on an **entire run** of protocol
actions and then list the necessary steps to removing those errors in an 
intelligent manner.

On the lower-level, since the software will be designed to output to our 
standard JSON protocol editor, we'll be able to create systems that manipulate
protocols on a logical level without having to write underlying infrastructure
code to manipulate complex JSON structures directly. 

See the `tests/` directory for examples of API usage and current support.