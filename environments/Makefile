.PHONY: setup, teardown
.DEFAULT_TARGET: setup

OT_2 := ot-2
OT_3 := ot-3
DEV := dev
APP := app

ENVIRONMENTS := $(OT_2) $(OT_3) $(DEV) $(APP)

SETUP_TARGETS := $(addsuffix -setup, $(ENVIRONMENTS))
TEARDOWN_TARGETS := $(addsuffix -teardown, $(ENVIRONMENTS))

%-setup:
	$(MAKE) -C $* setup

%-teardown:
	$(MAKE) -C $* teardown

setup:
	$(MAKE) $(SETUP_TARGETS)

teardown:
	$(MAKE) $(TEARDOWN_TARGETS)
