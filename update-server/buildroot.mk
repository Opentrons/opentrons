################################################################################
#
# python-opentrons-update-server
#
################################################################################

define OTUPDATESERVER_CALL_PBU
	$(shell python $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/scripts/python_build_utils.py update-server $(or $(OPENTRONS_PROJECT),robot-stack) $(1))
endef

PYTHON_OPENTRONS_UPDATE_SERVER_VERSION = $(call OTUPDATESERVER_CALL_PBU,get_version)
PYTHON_OPENTRONS_UPDATE_SERVER_LICENSE = Apache-2
PYTHON_OPENTRONS_UPDATE_SERVER_LICENSE_FILES = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/LICENSE
PYTHON_OPENTRONS_UPDATE_SERVER_SETUP_TYPE = setuptools
PYTHON_OPENTRONS_UPDATE_SERVER_SITE_METHOD = local
PYTHON_OPENTRONS_UPDATE_SERVER_SITE = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)
PYTHON_OPENTRONS_UPDATE_SERVER_SUBDIR = update-server
PYTHON_OPENTRONS_UPDATE_SERVER_POST_INSTALL_TARGET_HOOKS = PYTHON_OPENTRONS_UPDATE_SERVER_INSTALL_VERSION

define OTUS_DUMP_BR_VERSION
  $(shell python $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/scripts/python_build_utils.py update-server robot-stack dump_br_version)
endef

define PYTHON_OPENTRONS_UPDATE_SERVER_INSTALL_VERSION
	echo '$(call OTUPDATESERVER_CALL_PBU,dump_br_version)' > $(BINARIES_DIR)/opentrons-update-server-version.json
endef

otupdate_name := python-opentrons-update-server

define PYTHON_OPENTRONS_UPDATE_SERVER_INSTALL_INIT_SYSTEMD
	$(INSTALL) -D -m 0644 $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/update-server/opentrons-update-server.service \
	  $(TARGET_DIR)/etc/systemd/system/opentrons-update-server.service

  mkdir -p $(TARGET_DIR)/etc/systemd/system/opentrons.target.wants

  ln -sf ../opentrons-update-server.service \
    $(TARGET_DIR)/etc/systemd/system/opentrons.target.wants/opentrons-update-server.service
endef
export OPENTRONS_GIT_DIR=$(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)

# Calling inner-python-package directly instead of using python-package macro
# because our directory layout doesn’t conform to buildroot’s expectation of
# having the directory name be the package name
$(eval $(call inner-python-package,$(otupdate_name),$(call UPPERCASE,$(otupdate_name)),$(call UPPERCASE,$(otupdate_name)),target))

