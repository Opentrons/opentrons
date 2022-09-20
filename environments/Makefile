.PHONY: setup, teardown
.DEFAULT_TARGET: setup

setup:
	$(MAKE) -C ot-2 setup
	$(MAKE) -C ot-3 setup
	$(MAKE) -C dev setup
	$(MAKE) -C app setup

teardown:
	$(MAKE) -C ot-2 teardown
	$(MAKE) -C ot-3 teardown
	$(MAKE) -C dev teardown
	$(MAKE) -C app teardown

setupfaster:
	$(MAKE) -C ot-2 setup & \
	$(MAKE) -C ot-3 setup & \
	$(MAKE) -C dev setup & \
	$(MAKE) -C app setup & \
	wait;