.PHONY: setup, teardown, setup-robot-server, setup-update-server, teardown-robot-server, teardown-update-server
.DEFAULT_TARGET: setup

setup: setup-robot-server setup-update-server

setup-robot-server:
	$(MAKE) -C robot-server setup

setup-update-server:
	$(MAKE) -C update-server setup

teardown: teardown-robot-server teardown-update-server

teardown-robot-server:
	$(MAKE) -C robot-server teardown

teardown-update-server:
	$(MAKE) -C update-server teardown
