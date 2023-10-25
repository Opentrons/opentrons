# Makefile inclusions for buildroot integration
include $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/api/buildroot.mk
include $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/update-server/buildroot.mk
include $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/robot-server/buildroot.mk
include $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/shared-data/python/buildroot.mk
include $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/notify-server/buildroot.mk
include $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/system-server/buildroot.mk
include $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/server-utils/buildroot.mk
include $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/hardware/buildroot.mk
