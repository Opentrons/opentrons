################################################################################
#
# python-opentrons-shared-data
#
################################################################################

# Get a key from package.json (like version)
define get_pkg_json_key
	$(shell python -c "import json; print(json.load(open('$(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/shared-data/package.json'))[\"$(1)\"])")
endef

PYTHON_OPENTRONS_SHARED_DATA_VERSION = $(call get_pkg_json_key,version)
PYTHON_OPENTRONS_SHARED_DATA_LICENSE = $(call get_pkg_json_key,license)
PYTHON_OPENTRONS_SHARED_DATA_LICENSE_FILES = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/LICENSE
PYTHON_OPENTRONS_SHARED_DATA_SETUP_TYPE = setuptools
PYTHON_OPENTRONS_SHARED_DATA_SITE_METHOD = local
PYTHON_OPENTRONS_SHARED_DATA_SITE = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)
PYTHON_OPENTRONS_SHARED_DATA_SUBDIR = shared-data/python

define OTSD_DUMP_BR_VERSION
	$(shell python $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/scripts/python_build_utils.py shared-data dump_br_version)
endef

define PYTHON_OPENTRONS_SHARED_DATA_INSTALL_VERSION
	echo '$(call OTSD_DUMP_BR_VERSION)' > $(BINARIES_DIR)/opentrons-shared-data-version.json
endef

ot_sd_name := python-opentrons-shared-data

# Calling inner-python-package directly instead of using python-package macro
# because our directory layout doesn’t conform to buildroot’s expectation of
# having the directory name be the package name
$(eval $(call inner-python-package,$(ot_sd_name),$(call UPPERCASE,$(ot_sd_name)),$(call UPPERCASE,$(ot_sd_name)),target))
