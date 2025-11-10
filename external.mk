# Makefile inclusions for buildroot integration
include $(sort $(wildcard $(BR2_EXTERNAL_OPENTRONS_MONOREPO_PATH)/*/buildroot.mk))
