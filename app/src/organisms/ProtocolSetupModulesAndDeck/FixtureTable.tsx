import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  Chip,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LocationIcon,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_USB_MODULE_ADDRESSABLE_AREAS,
  getCutoutDisplayName,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  getSimplestDeckConfigForProtocol,
  SINGLE_SLOT_FIXTURES,
} from '@opentrons/shared-data'

import { SmallButton } from '../../atoms/buttons'
import { useDeckConfigurationCompatibility } from '../../resources/deck_configuration/hooks'
import { getRequiredDeckConfig } from '../../resources/deck_configuration/utils'
import { LocationConflictModal } from '../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal'

import type {
  CompletedProtocolAnalysis,
  CutoutFixtureId,
  CutoutId,
  DeckDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type { SetupScreens } from '../../pages/ProtocolSetup'
import type { CutoutConfigAndCompatibility } from '../../resources/deck_configuration/hooks'
import { useSelector } from 'react-redux'
import { getLocalRobot } from '../../redux/discovery'

interface FixtureTableProps {
  robotType: RobotType
  mostRecentAnalysis: CompletedProtocolAnalysis | null
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
  setCutoutId: (cutoutId: CutoutId) => void
  setProvidedFixtureOptions: (providedFixtureOptions: CutoutFixtureId[]) => void
}

/**
 * Table of all "non-module" fixtures e.g. staging slot, waste chute, trash bin...
 * @param props
 * @returns JSX.Element
 */
export function FixtureTable({
  robotType,
  mostRecentAnalysis,
  setSetupScreen,
  setCutoutId,
  setProvidedFixtureOptions,
}: FixtureTableProps): JSX.Element | null {
  const requiredFixtureDetails = getSimplestDeckConfigForProtocol(
    mostRecentAnalysis
  )
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    mostRecentAnalysis
  )
  const deckDef = getDeckDefFromRobotType(robotType)
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : ''

  const requiredDeckConfigCompatibility = getRequiredDeckConfig(
    deckConfigCompatibility
  )

  // list not configured/conflicted fixtures first
  const sortedDeckConfigCompatibility = requiredDeckConfigCompatibility.sort(
    a =>
      a.cutoutFixtureId != null &&
      a.compatibleCutoutFixtureIds.includes(a.cutoutFixtureId)
        ? 1
        : -1
  )

  return sortedDeckConfigCompatibility.length > 0 ? (
    <>
      {sortedDeckConfigCompatibility.map((fixtureCompatibility, index) => {
        // filter out all fixtures that only provide module addressable areas (e.g. everything but StagingAreaWithMagBlockV1)
        // as they're handled in the Modules Table
        return fixtureCompatibility.requiredAddressableAreas.every(raa =>
          FLEX_USB_MODULE_ADDRESSABLE_AREAS.includes(raa)
        ) ? null : (
          <FixtureTableItem
            key={`FixtureTableItem_${index}`}
            {...fixtureCompatibility}
            lastItem={index === requiredFixtureDetails.length - 1}
            setSetupScreen={setSetupScreen}
            setCutoutId={setCutoutId}
            setProvidedFixtureOptions={setProvidedFixtureOptions}
            deckDef={deckDef}
            robotName={robotName}
          />
        )
      })}
    </>
  ) : null
}

interface FixtureTableItemProps extends CutoutConfigAndCompatibility {
  lastItem: boolean
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
  setCutoutId: (cutoutId: CutoutId) => void
  setProvidedFixtureOptions: (providedFixtureOptions: CutoutFixtureId[]) => void
  deckDef: DeckDefinition
  robotName: string
}

function FixtureTableItem({
  cutoutId,
  cutoutFixtureId,
  compatibleCutoutFixtureIds,
  missingLabwareDisplayName,
  lastItem,
  setSetupScreen,
  setCutoutId,
  setProvidedFixtureOptions,
  deckDef,
  robotName,
}: FixtureTableItemProps): JSX.Element {
  const { t, i18n } = useTranslation('protocol_setup')

  const [
    showLocationConflictModal,
    setShowLocationConflictModal,
  ] = React.useState<boolean>(false)

  const isCurrentFixtureCompatible =
    cutoutFixtureId != null &&
    compatibleCutoutFixtureIds.includes(cutoutFixtureId)
  const isRequiredSingleSlotMissing = missingLabwareDisplayName != null
  let chipLabel: JSX.Element
  if (!isCurrentFixtureCompatible) {
    const isConflictingFixtureConfigured =
      cutoutFixtureId != null && !SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)
    chipLabel = (
      <>
        <Chip
          text={
            isConflictingFixtureConfigured
              ? i18n.format(t('location_conflict'), 'capitalize')
              : i18n.format(t('not_configured'), 'capitalize')
          }
          type="warning"
          background={false}
          iconName="connection-status"
        />
        <SmallButton
          buttonCategory="rounded"
          buttonText={
            isConflictingFixtureConfigured ? t('resolve') : t('configure')
          }
          onClick={
            isConflictingFixtureConfigured
              ? () => setShowLocationConflictModal(true)
              : () => {
                  setCutoutId(cutoutId)
                  setProvidedFixtureOptions(compatibleCutoutFixtureIds)
                  setSetupScreen('deck configuration')
                }
          }
        />
      </>
    )
  } else {
    chipLabel = (
      <Chip
        text={i18n.format(t('configured'), 'capitalize')}
        type="success"
        background={false}
        iconName="connection-status"
      />
    )
  }
  return (
    <React.Fragment key={cutoutId}>
      {showLocationConflictModal ? (
        <LocationConflictModal
          onCloseClick={() => setShowLocationConflictModal(false)}
          cutoutId={cutoutId}
          requiredFixtureId={compatibleCutoutFixtureIds[0]}
          isOnDevice={true}
          missingLabwareDisplayName={missingLabwareDisplayName}
          deckDef={deckDef}
          robotName={robotName}
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        backgroundColor={
          isCurrentFixtureCompatible ? COLORS.green35 : COLORS.yellow35
        }
        borderRadius={BORDERS.borderRadius8}
        gridGap={SPACING.spacing24}
        padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
        marginBottom={lastItem ? SPACING.spacing68 : 'none'}
      >
        <Flex flex="3.5 0 0" alignItems={ALIGN_CENTER}>
          <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {cutoutFixtureId != null &&
            (isCurrentFixtureCompatible || isRequiredSingleSlotMissing)
              ? getFixtureDisplayName(cutoutFixtureId)
              : getFixtureDisplayName(compatibleCutoutFixtureIds?.[0])}
          </StyledText>
        </Flex>
        <Flex flex="2 0 0" alignItems={ALIGN_CENTER}>
          <LocationIcon slotName={getCutoutDisplayName(cutoutId)} />
        </Flex>
        <Flex
          flex="4 0 0"
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          {chipLabel}
        </Flex>
      </Flex>
    </React.Fragment>
  )
}
