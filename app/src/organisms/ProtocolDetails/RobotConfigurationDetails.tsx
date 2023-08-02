import React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  ModuleIcon,
  SIZE_1,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  getModuleType,
  getPipetteNameSpecs,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { InstrumentContainer } from '../../atoms/InstrumentContainer'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'
import { useFeatureFlag } from '../../redux/config'
import { getRobotTypeDisplayName } from '../ProtocolsLanding/utils'
import { getSlotsForThermocycler } from './utils'

import type { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/setup'
import type { PipetteName, RobotType } from '@opentrons/shared-data'

interface RobotConfigurationDetailsProps {
  leftMountPipetteName: PipetteName | null
  rightMountPipetteName: PipetteName | null
  extensionInstrumentName: string | null
  requiredModuleDetails: LoadModuleRunTimeCommand[] | null
  isLoading: boolean
  robotType: RobotType | null
}

export const RobotConfigurationDetails = (
  props: RobotConfigurationDetailsProps
): JSX.Element => {
  const {
    leftMountPipetteName,
    rightMountPipetteName,
    extensionInstrumentName,
    requiredModuleDetails,
    isLoading,
    robotType,
  } = props
  const { t } = useTranslation(['protocol_details', 'shared'])
  const enableExtendedHardware = useFeatureFlag('enableExtendedHardware')

  const loadingText = <StyledText as="p">{t('shared:loading')}</StyledText>
  const emptyText = (
    <StyledText as="p" textTransform={TYPOGRAPHY.textTransformCapitalize}>
      {t('shared:empty')}
    </StyledText>
  )

  // TODO(bh, 2022-10-18): insert 96-channel display name
  // const leftAndRightMountsPipetteDisplayName = 'P20 96-Channel GEN1'
  const leftAndRightMountsPipetteDisplayName = null
  const leftAndRightMountsItem =
    leftAndRightMountsPipetteDisplayName != null ? (
      <RobotConfigurationDetailsItem
        label={t('left_and_right_mounts')}
        item={
          isLoading ? (
            loadingText
          ) : (
            <InstrumentContainer
              displayName={leftAndRightMountsPipetteDisplayName}
            />
          )
        }
      />
    ) : null

  const leftMountPipetteDisplayName =
    getPipetteNameSpecs(leftMountPipetteName as PipetteName)?.displayName ??
    null
  const leftMountItem =
    leftMountPipetteDisplayName != null ? (
      <InstrumentContainer displayName={leftMountPipetteDisplayName} />
    ) : (
      emptyText
    )

  const rightMountPipetteDisplayName =
    getPipetteNameSpecs(rightMountPipetteName as PipetteName)?.displayName ??
    null
  const rightMountItem =
    rightMountPipetteDisplayName != null ? (
      <InstrumentContainer displayName={rightMountPipetteDisplayName} />
    ) : (
      emptyText
    )

  const extensionMountItem =
    extensionInstrumentName != null ? (
      <InstrumentContainer displayName={extensionInstrumentName} />
    ) : (
      emptyText
    )

  return (
    <Flex flexDirection={DIRECTION_COLUMN} paddingBottom={SPACING.spacing24}>
      <RobotConfigurationDetailsItem
        label={t('robot')}
        item={
          isLoading ? (
            loadingText
          ) : (
            <StyledText as="p">{getRobotTypeDisplayName(robotType)}</StyledText>
          )
        }
      />
      <Divider marginY={SPACING.spacing12} width="100%" />
      {leftAndRightMountsItem ?? (
        <>
          <RobotConfigurationDetailsItem
            label={t('left_mount')}
            item={isLoading ? loadingText : leftMountItem}
          />
          <Divider marginY={SPACING.spacing12} width="100%" />
          <RobotConfigurationDetailsItem
            label={t('right_mount')}
            item={isLoading ? loadingText : rightMountItem}
          />
        </>
      )}
      {enableExtendedHardware ? (
        <>
          <Divider marginY={SPACING.spacing12} width="100%" />
          <RobotConfigurationDetailsItem
            label={t('shared:extension_mount')}
            item={isLoading ? loadingText : extensionMountItem}
          />
        </>
      ) : null}
      {requiredModuleDetails != null
        ? requiredModuleDetails.map((module, index) => {
            return (
              <React.Fragment key={index}>
                <Divider marginY={SPACING.spacing12} width="100%" />
                <RobotConfigurationDetailsItem
                  label={t('run_details:module_slot_number', {
                    slot_number:
                      getModuleType(module.params.model) ===
                      THERMOCYCLER_MODULE_TYPE
                        ? getSlotsForThermocycler(robotType)
                        : module.params.location.slotName,
                  })}
                  item={
                    <>
                      <ModuleIcon
                        key={index}
                        moduleType={getModuleType(module.params.model)}
                        marginRight={SPACING.spacing4}
                        alignSelf={ALIGN_CENTER}
                        color={COLORS.darkGreyEnabled}
                        height={SIZE_1}
                        minWidth={SIZE_1}
                        minHeight={SIZE_1}
                      />
                      <StyledText as="p">
                        {getModuleDisplayName(module.params.model)}
                      </StyledText>
                    </>
                  }
                />
              </React.Fragment>
            )
          })
        : null}
    </Flex>
  )
}

interface RobotConfigurationDetailsItemProps {
  label: string
  item: React.ReactNode
}

export const RobotConfigurationDetailsItem = (
  props: RobotConfigurationDetailsItemProps
): JSX.Element => {
  const { label, item } = props
  return (
    <Flex
      flex="1 0 100%"
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
    >
      <StyledText
        as="label"
        flex="0 0 auto"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        marginRight={SPACING.spacing16}
        color={COLORS.darkGreyEnabled}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        width="4.625rem"
      >
        {label}
      </StyledText>
      <Flex data-testid={`RobotConfigurationDetails_${label}`}>{item}</Flex>
    </Flex>
  )
}
