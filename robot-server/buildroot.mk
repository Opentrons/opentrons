################################################################################
#
# python-opentrons-robot-server
#
################################################################################

# Get a key from package.json (like version)
define get_pkg_json_key
	$(shell python -c "import json; print(json.load(open('$(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/robot-server/robot_server/package.json'))[\"$(1)\"])")
endef

PYTHON_OPENTRONS_ROBOT_SERVER_VERSION = $(call get_pkg_json_key,version)
PYTHON_OPENTRONS_ROBOT_SERVER_LICENSE = $(call get_pkg_json_key,license)
PYTHON_OPENTRONS_ROBOT_SERVER_LICENSE_FILES = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/LICENSE
PYTHON_OPENTRONS_ROBOT_SERVER_SETUP_TYPE = setuptools
PYTHON_OPENTRONS_ROBOT_SERVER_SITE_METHOD = local
PYTHON_OPENTRONS_ROBOT_SERVER_SITE = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)
PYTHON_OPENTRONS_ROBOT_SERVER_SUBDIR = robot-server
PYTHON_OPENTRONS_ROBOT_SERVER_POST_INSTALL_TARGET_HOOKS = PYTHON_OPENTRONS_ROBOT_SERVER_INSTALL_VERSION
PYTHON_OPENTRONS_ROBOT_SERVER_SERVICE_FILE_NAME=opentrons-robot-server.service

define OTAPI_DUMP_BR_VERSION
	$(shell python $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/scripts/python_build_utils.py robot-server dump_br_version)
endef

define PYTHON_OPENTRONS_ROBOT_SERVER_INSTALL_VERSION
	echo '$(call OTAPI_DUMP_BR_VERSION)' > $(BINARIES_DIR)/opentrons-robot-server-version.json
endef

ot_api_name := python-opentrons-robot-server

define PYTHON_OPENTRONS_ROBOT_SERVER_INSTALL_INIT_SYSTEMD
	$(INSTALL) -D -m 0644 $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/robot-server/$(PYTHON_OPENTRONS_ROBOT_SERVER_SERVICE_FILE_NAME) \
	  $(TARGET_DIR)/etc/systemd/system/$(PYTHON_OPENTRONS_ROBOT_SERVER_SERVICE_FILE_NAME)

  mkdir -p $(TARGET_DIR)/etc/systemd/system/opentrons.target.wants

  ln -sf ../$(PYTHON_OPENTRONS_ROBOT_SERVER_SERVICE_FILE_NAME) \
    $(TARGET_DIR)/etc/systemd/system/opentrons.target.wants/$(PYTHON_OPENTRONS_ROBOT_SERVER_SERVICE_FILE_NAME)
endef

# Calling inner-python-package directly instead of using python-package macro
# because our directory layout doesn’t conform to buildroot’s expectation of
# having the directory name be the package name
$(eval $(call inner-python-package,$(ot_api_name),$(call UPPERCASE,$(ot_api_name)),$(call UPPERCASE,$(ot_api_name)),target))

