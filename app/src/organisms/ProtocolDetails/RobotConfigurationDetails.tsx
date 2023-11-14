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
  getCutoutDisplayName,
  getFixtureDisplayName,
  getModuleDisplayName,
  getModuleType,
  getPipetteNameSpecs,
  SINGLE_SLOT_FIXTURES,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { InstrumentContainer } from '../../atoms/InstrumentContainer'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'
import { getRobotTypeDisplayName } from '../ProtocolsLanding/utils'
import { getSlotsForThermocycler } from './utils'

import type {
  LoadModuleRunTimeCommand,
  PipetteName,
  RobotType,
  SingleSlotCutoutFixtureId,
} from '@opentrons/shared-data'
import type { CutoutConfigProtocolSpec } from '../../resources/deck_configuration/utils'

interface RobotConfigurationDetailsProps {
  leftMountPipetteName: PipetteName | null
  rightMountPipetteName: PipetteName | null
  extensionInstrumentName: string | null
  requiredModuleDetails: LoadModuleRunTimeCommand[]
  requiredFixtureDetails: CutoutConfigProtocolSpec[]
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
    requiredFixtureDetails,
    isLoading,
    robotType,
  } = props
  const { t } = useTranslation(['protocol_details', 'shared'])

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

  // filter out single slot fixtures
  const nonStandardRequiredFixtureDetails = requiredFixtureDetails.filter(
    fixture =>
      !SINGLE_SLOT_FIXTURES.includes(
        fixture.cutoutFixtureId as SingleSlotCutoutFixtureId
      )
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
      {robotType === 'OT-3 Standard' ? (
        <>
          <Divider marginY={SPACING.spacing12} width="100%" />
          <RobotConfigurationDetailsItem
            label={t('shared:extension_mount')}
            item={isLoading ? loadingText : extensionMountItem}
          />
        </>
      ) : null}
      {requiredModuleDetails.map((module, index) => {
        return (
          <React.Fragment key={`module_${index}`}>
            <Divider marginY={SPACING.spacing12} width="100%" />
            <RobotConfigurationDetailsItem
              label={
                getModuleType(module.params.model) === THERMOCYCLER_MODULE_TYPE
                  ? getSlotsForThermocycler(robotType)
                  : module.params.location.slotName
              }
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
      })}
      {nonStandardRequiredFixtureDetails.map((fixture, index) => {
        return (
          <React.Fragment key={`fixture_${index}`}>
            <Divider marginY={SPACING.spacing12} width="100%" />
            <RobotConfigurationDetailsItem
              label={getCutoutDisplayName(fixture.cutoutId)}
              item={
                <StyledText as="p">
                  {getFixtureDisplayName(fixture.cutoutFixtureId)}
                </StyledText>
              }
            />
          </React.Fragment>
        )
      })}
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
