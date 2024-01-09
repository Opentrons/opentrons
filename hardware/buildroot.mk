################################################################################
#
# python-opentrons-hardware
#
################################################################################

define OTHARDWARE_CALL_PBU
	$(shell python $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/scripts/python_build_utils.py hardware $(or $(OPENTRONS_PROJECT),robot-stack) $(1))
endef

PYTHON_OPENTRONS_HARDWARE_VERSION = $(call OTHARDWARE_CALL_PBU,get_version)
PYTHON_OPENTRONS_HARDWARE_LICENSE = Apache-2
PYTHON_OPENTRONS_HARDWARE_LICENSE_FILES = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/LICENSE
PYTHON_OPENTRONS_HARDWARE_SETUP_TYPE = setuptools
PYTHON_OPENTRONS_HARDWARE_SITE_METHOD = local
PYTHON_OPENTRONS_HARDWARE_SITE = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)
PYTHON_OPENTRONS_HARDWARE_SUBDIR = hardware
PYTHON_OPENTRONS_HARDWARE_POST_INSTALL_TARGET_HOOKS = PYTHON_OPENTRONS_HARDWARE_INSTALL_VERSION

define PYTHON_OPENTRONS_HARDWARE_INSTALL_VERSION
	echo '$(call OTHARDWARE_CALL_PBU,dump_br_version)' > $(BINARIES_DIR)/opentrons-hardware-version.json
endef

ot_hardware_name := python-opentrons-hardware

export OPENTRONS_GIT_DIR=$(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)

# Calling inner-python-package directly instead of using python-package macro
# because our directory layout doesn’t conform to buildroot’s expectation of
# having the directory name be the package name
$(eval $(call inner-python-package,$(ot_hardware_name),$(call UPPERCASE,$(ot_hardware_name)),$(call UPPERCASE,$(ot_hardware_name)),target))

