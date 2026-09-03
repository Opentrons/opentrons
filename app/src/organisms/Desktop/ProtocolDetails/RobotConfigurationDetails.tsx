import { Fragment } from 'react'
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
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_STACKER_MODULE_TYPE,
  FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE,
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  FLEX_USB_MODULE_FIXTURES,
  getAASlotDisplayName,
  getAAWithFakesFromVSId,
  getCutoutDisplayName,
  getFixtureDisplayName,
  getModuleDeckLabel,
  getModuleDisplayName,
  getModuleType,
  getPipetteNameSpecs,
  getVisualSlotIdForAA,
  MAGNETIC_BLOCK_ADDRESSABLE_AREAS,
  MAGNETIC_BLOCK_FIXTURES,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_BLOCK_V1_FIXTURE,
  SINGLE_SLOT_FIXTURES,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE,
  WASTE_CHUTE_FLEX_STACKER_FIXTURES,
} from '@opentrons/shared-data'

import { InstrumentContainer } from '/app/atoms/InstrumentContainer'
import { Divider } from '/app/atoms/structure'

import { getRobotTypeDisplayName } from '../ProtocolsLanding/utils'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type {
  CutoutConfigProtocolSpec,
  LoadModuleRunTimeCommand,
  PipetteName,
  RobotType,
  SingleSlotCutoutFixtureId,
  VISUAL_SLOTS,
} from '@opentrons/shared-data'

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
): ReactNode => {
  const {
    leftMountPipetteName,
    rightMountPipetteName,
    extensionInstrumentName,
    requiredModuleDetails,
    requiredFixtureDetails,
    isLoading,
    robotType,
  } = props
  const { t } = useTranslation([
    'protocol_details',
    'shared',
    'deck_configuration',
  ])

  const loadingText = (
    <StyledText desktopStyle="bodyDefaultRegular">
      {t('shared:loading')}
    </StyledText>
  )
  const emptyText = (
    <StyledText
      desktopStyle="bodyDefaultRegular"
      textTransform={TYPOGRAPHY.textTransformCapitalize}
    >
      {t('shared:empty')}
    </StyledText>
  )

  const is96PipetteUsed = leftMountPipetteName === 'p1000_96'
  const leftMountPipetteDisplayName =
    getPipetteNameSpecs(leftMountPipetteName!)?.displayName ?? null
  const leftMountItem =
    leftMountPipetteDisplayName != null ? (
      <InstrumentContainer displayName={leftMountPipetteDisplayName} />
    ) : (
      emptyText
    )

  const rightMountPipetteDisplayName =
    getPipetteNameSpecs(rightMountPipetteName!)?.displayName ?? null
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

  // filter out single slot fixtures as they're implicit
  // also filter out usb module fixtures as they're handled by required modules
  const nonStandardRequiredFixtureDetails = requiredFixtureDetails.reduce<
    CutoutConfigProtocolSpec[]
  >((acc, fixture) => {
    if (
      [
        ...SINGLE_SLOT_FIXTURES,
        ...FLEX_USB_MODULE_FIXTURES,
        ...WASTE_CHUTE_FLEX_STACKER_FIXTURES,
      ].includes(fixture.cutoutFixtureId as SingleSlotCutoutFixtureId)
    ) {
      return acc
    } else if (
      FLEX_STACKER_WITH_MAG_BLOCK_FIXTURE === fixture.cutoutFixtureId ||
      fixture.cutoutFixtureId ===
        STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE
    ) {
      const magBlockAA = fixture.requiredAddressableAreas.find(aa =>
        MAGNETIC_BLOCK_ADDRESSABLE_AREAS.includes(aa)
      )
      acc.push({
        ...fixture,
        cutoutFixtureId: MAGNETIC_BLOCK_V1_FIXTURE,
        requiredAddressableAreas: [
          magBlockAA ?? fixture.requiredAddressableAreas[0],
        ],
      })
      if (
        fixture.cutoutFixtureId ===
        STAGING_AREA_SLOT_WITH_MAGNETIC_BLOCK_V1_FIXTURE
      ) {
        const stagingAreaAA = fixture.requiredAddressableAreas.find(aa =>
          FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS.includes(aa)
        )
        acc.push({
          ...fixture,
          cutoutFixtureId: STAGING_AREA_RIGHT_SLOT_FIXTURE,
          requiredAddressableAreas: [
            stagingAreaAA ?? fixture.requiredAddressableAreas[0],
          ],
        })
      }
    } else {
      acc.push(fixture)
    }
    return acc
  }, [])

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <RobotConfigurationDetailsItem
        label={t('robot')}
        item={
          isLoading ? (
            loadingText
          ) : (
            <StyledText desktopStyle="bodyDefaultRegular">
              {getRobotTypeDisplayName(robotType)}
            </StyledText>
          )
        }
      />
      <Divider marginY={SPACING.spacing12} width="100%" />
      <RobotConfigurationDetailsItem
        label={is96PipetteUsed ? t('left_and_right_mounts') : t('left_mount')}
        item={isLoading ? loadingText : leftMountItem}
      />
      {!is96PipetteUsed && (
        <>
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
      {requiredModuleDetails
        .sort((a, b) =>
          a.params.location.slotName.localeCompare(b.params.location.slotName)
        )
        .map((module, index) => {
          const moduleType = getModuleType(module.params.model)

          const fixtureD3 = requiredFixtureDetails.find(
            fixture => fixture.cutoutId === 'cutoutD3'
          )
          const moduleDisplayName =
            moduleType === FLEX_STACKER_MODULE_TYPE &&
            module.params.location.slotName === 'D3' &&
            fixtureD3 != null
              ? getFixtureDisplayName(t as TFunction, fixtureD3.cutoutFixtureId)
              : getModuleDisplayName(module.params.model)

          return (
            <Fragment key={`module_${index}`}>
              <Divider marginY={SPACING.spacing12} width="100%" />
              <RobotConfigurationDetailsItem
                label={t('slot', {
                  slotName: getModuleDeckLabel(
                    getModuleType(module.params.model),
                    module.params.location.slotName
                  ),
                })}
                item={
                  <>
                    <ModuleIcon
                      key={index}
                      moduleType={getModuleType(module.params.model)}
                      marginRight={SPACING.spacing4}
                      alignSelf={ALIGN_CENTER}
                      color={COLORS.grey50}
                      height={SIZE_1}
                      minWidth={SIZE_1}
                      minHeight={SIZE_1}
                    />
                    <StyledText desktopStyle="bodyDefaultRegular">
                      {moduleDisplayName}
                    </StyledText>
                  </>
                }
              />
            </Fragment>
          )
        })}
      {nonStandardRequiredFixtureDetails.map((fixture, index) => {
        const visualSlotId = getVisualSlotIdForAA(
          fixture.cutoutId,
          fixture.cutoutFixtureId,
          fixture.requiredAddressableAreas[0]
        )
        const AAName = getAAWithFakesFromVSId(visualSlotId as VISUAL_SLOTS)
        return (
          <Fragment key={`fixture_${index}`}>
            <Divider marginY={SPACING.spacing12} width="100%" />
            <RobotConfigurationDetailsItem
              label={t('slot', {
                slotName:
                  AAName != null
                    ? getAASlotDisplayName(AAName)
                    : getCutoutDisplayName(fixture.cutoutId),
              })}
              item={
                <>
                  {MAGNETIC_BLOCK_FIXTURES.includes(fixture.cutoutFixtureId) ? (
                    <ModuleIcon
                      key={index}
                      moduleType={MAGNETIC_BLOCK_TYPE}
                      marginRight={SPACING.spacing4}
                      alignSelf={ALIGN_CENTER}
                      color={COLORS.grey50}
                      height={SIZE_1}
                      minWidth={SIZE_1}
                      minHeight={SIZE_1}
                    />
                  ) : null}
                  <StyledText desktopStyle="bodyDefaultRegular">
                    {getFixtureDisplayName(
                      t as TFunction,
                      fixture.cutoutFixtureId
                    )}
                  </StyledText>
                </>
              }
            />
          </Fragment>
        )
      })}
    </Flex>
  )
}

interface RobotConfigurationDetailsItemProps {
  label: string
  item: ReactNode
}

export const RobotConfigurationDetailsItem = (
  props: RobotConfigurationDetailsItemProps
): ReactNode => {
  const { label, item } = props
  return (
    <Flex
      flex="1 0 100%"
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
    >
      <StyledText
        desktopStyle="bodyDefaultRegular"
        flex="0 0 auto"
        marginRight={SPACING.spacing16}
        color={COLORS.grey60}
        textTransform={TYPOGRAPHY.textTransformCapitalize}
        width="9.375rem"
      >
        {label}
      </StyledText>
      <Flex data-testid={`RobotConfigurationDetails_${label}`}>{item}</Flex>
    </Flex>
  )
}
