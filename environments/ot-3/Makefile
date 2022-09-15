.PHONY: setup, teardown
.DEFAULT_TARGET: setup
setup:
	$(MAKE) -C robot-server setup
	$(MAKE) -C update-server setup

teardown:
	$(MAKE) -C robot-server teardown
	$(MAKE) -C update-server teardown
