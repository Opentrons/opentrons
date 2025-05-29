################################################################################
#
# python-opentrons-server-utils
#
################################################################################

define OTSERVERUTILS_CALL_PBU
	$(shell python $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/scripts/python_build_utils.py server-utils $(or $(OPENTRONS_PROJECT),robot-stack) $(1))
endef

PYTHON_OPENTRONS_SERVER_UTILS_VERSION = $(call OTSERVERUTILS_CALL_PBU,get_version)
PYTHON_OPENTRONS_SERVER_UTILS_LICENSE = Apache-2
PYTHON_OPENTRONS_SERVER_UTILS_LICENSE_FILES = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/LICENSE
PYTHON_OPENTRONS_SERVER_UTILS_SETUP_TYPE = hatch
PYTHON_OPENTRONS_SERVER_UTILS_SITE_METHOD = local
PYTHON_OPENTRONS_SERVER_UTILS_SITE = $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)
PYTHON_OPENTRONS_SERVER_UTILS_SUBDIR = server-utils
PYTHON_OPENTRONS_SERVER_UTILS_POST_INSTALL_TARGET_HOOKS = PYTHON_OPENTRONS_SERVER_UTILS_INSTALL_VERSION
PYTHON_OPENTRONS_SERVER_UTILS_SERVICE_FILE_NAME=opentrons-server-utils.service
PYTHON_OPENTRONS_SERVER_UTILS_DEPENDENCIES = host-python-hatch-vcs-tunable host-python-hatch-dependency-coversion

define PYTHON_OPENTRONS_SERVER_UTILS_INSTALL_VERSION
	echo '$(call OTSERVERUTILS_CALL_PBU,dump_br_version)' > $(BINARIES_DIR)/opentrons-server-utils-version.json
endef

ot_server_utils_name := python-opentrons-server-utils
export HATCH_VCS_TUNABLE_FALLBACK_VERSION=$(call OTSERVERUTILS_CALL_PBU,normalize_version)

# Calling inner-python-package directly instead of using python-package macro
# because our directory layout doesn’t conform to buildroot’s expectation of
# having the directory name be the package name
$(eval $(call inner-python-package,$(ot_server_utils_name),$(call UPPERCASE,$(ot_server_utils_name)),$(call UPPERCASE,$(ot_server_utils_name)),target))

