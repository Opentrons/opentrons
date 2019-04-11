# otupdate.buildroot: Buildroot system "system server"

This is the implementation for the update server that runs on machines running buildroot. Compared to the balena implementation, the buildroot update server is really a system server: in addition to doing updates, it also manages other system resources. In the future, we’ll express this by taking away privileges and capabilities from the API server that don’t have anything to do with running protocols and put them here instead; for now, this is just the place that new system capabilities should be added.
