################################################################################
#
# python-opentrons-shared-data
#
################################################################################

define OTSHAREDDATA_CALL_PBU
	$(shell python $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/scripts/python_build_utils.py shared-data $(or $(OPENTRONS_PROJECT),robot-stack) $(1))
endef

PYTHON_OPENTRONS_SHARED_DATA_VERSION = $(call OTSHAREDDATA_CALL_PBU,get_version)
PYTHON_OPENTRONS_SHARED_DATA_LICENSE = Apache-2
PYTHON_OPENTRONS_SHARED_DATA_LICENSE_FILES = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/LICENSE
PYTHON_OPENTRONS_SHARED_DATA_SETUP_TYPE = setuptools
PYTHON_OPENTRONS_SHARED_DATA_SITE_METHOD = local
PYTHON_OPENTRONS_SHARED_DATA_SITE = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)
PYTHON_OPENTRONS_SHARED_DATA_SUBDIR = shared-data/python

define PYTHON_OPENTRONS_SHARED_DATA_INSTALL_VERSION
	echo '$(call OTSHAREDDATA_CALL_PBU,dump_br_version)' > $(BINARIES_DIR)/opentrons-shared-data-version.json
endef

ot_sd_name := python-opentrons-shared-data

export OPENTRONS_GIT_DIR=$(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)

# Calling inner-python-package directly instead of using python-package macro
# because our directory layout doesn’t conform to buildroot’s expectation of
# having the directory name be the package name
$(eval $(call inner-python-package,$(ot_sd_name),$(call UPPERCASE,$(ot_sd_name)),$(call UPPERCASE,$(ot_sd_name)),target))
