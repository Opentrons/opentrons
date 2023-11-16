import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  LocationIcon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS,
  getCutoutDisplayName,
  getFixtureDisplayName,
  SINGLE_SLOT_FIXTURES,
} from '@opentrons/shared-data'
import { useDeckConfigurationCompatibility } from '../../resources/deck_configuration/hooks'
import { LocationConflictModal } from '../Devices/ProtocolRun/SetupModuleAndDeck/LocationConflictModal'
import { StyledText } from '../../atoms/text'
import { Chip } from '../../atoms/Chip'
import { getSimplestDeckConfigForProtocolCommands } from '../../resources/deck_configuration/utils'

import type {
  CompletedProtocolAnalysis,
  CutoutFixtureId,
  CutoutId,
  RobotType,
} from '@opentrons/shared-data'
import type { SetupScreens } from '../../pages/OnDeviceDisplay/ProtocolSetup'

interface FixtureTableProps {
  robotType: RobotType
  mostRecentAnalysis: CompletedProtocolAnalysis | null
  setSetupScreen: React.Dispatch<React.SetStateAction<SetupScreens>>
  setCutoutId: (cutoutId: CutoutId) => void
  setProvidedFixtureOptions: (providedFixtureOptions: CutoutFixtureId[]) => void
}

export function FixtureTable({
  robotType,
  mostRecentAnalysis,
  setSetupScreen,
  setCutoutId,
  setProvidedFixtureOptions,
}: FixtureTableProps): JSX.Element | null {
  const { t, i18n } = useTranslation('protocol_setup')

  const [
    showLocationConflictModal,
    setShowLocationConflictModal,
  ] = React.useState<boolean>(false)

  const requiredFixtureDetails = getSimplestDeckConfigForProtocolCommands(
    mostRecentAnalysis?.commands ?? []
  )
  const deckConfigCompatibility = useDeckConfigurationCompatibility(
    robotType,
    mostRecentAnalysis?.commands ?? []
  )

  const nonSingleSlotDeckConfigCompatibility = deckConfigCompatibility.filter(
    ({ requiredAddressableAreas }) =>
      // required AA list includes a non-single-slot AA
      !requiredAddressableAreas.every(aa =>
        FLEX_SINGLE_SLOT_ADDRESSABLE_AREAS.includes(aa)
      )
  )
  // fixture includes at least 1 required AA
  const requiredDeckConfigCompatibility = nonSingleSlotDeckConfigCompatibility.filter(
    fixture => fixture.requiredAddressableAreas.length > 0
  )

  return requiredDeckConfigCompatibility.length > 0 ? (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      <Flex
        color={COLORS.darkBlack70}
        fontSize={TYPOGRAPHY.fontSize22}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        gridGap={SPACING.spacing24}
        lineHeight={TYPOGRAPHY.lineHeight28}
        paddingX={SPACING.spacing24}
      >
        <StyledText flex="4 0 0">{t('fixture')}</StyledText>
        <StyledText flex="2 0 0">{t('location')}</StyledText>
        <StyledText flex="3 0 0"> {t('status')}</StyledText>
      </Flex>
      {requiredDeckConfigCompatibility.map(
        ({ cutoutId, cutoutFixtureId, compatibleCutoutFixtureIds }, index) => {
          const isCurrentFixtureCompatible =
            cutoutFixtureId != null &&
            compatibleCutoutFixtureIds.includes(cutoutFixtureId)

          let chipLabel: JSX.Element
          let handleClick
          if (!isCurrentFixtureCompatible) {
            const isConflictingFixtureConfigured =
              cutoutFixtureId != null &&
              !SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)
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
                <Icon name="more" size="3rem" />
              </>
            )
            handleClick = isConflictingFixtureConfigured
              ? () => setShowLocationConflictModal(true)
              : () => {
                  setCutoutId(cutoutId)
                  setProvidedFixtureOptions(compatibleCutoutFixtureIds)
                  setSetupScreen('deck configuration')
                }
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
                />
              ) : null}
              <Flex
                flexDirection={DIRECTION_ROW}
                alignItems={ALIGN_CENTER}
                backgroundColor={
                  isCurrentFixtureCompatible ? COLORS.green3 : COLORS.yellow3
                }
                borderRadius={BORDERS.borderRadiusSize3}
                gridGap={SPACING.spacing24}
                padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
                onClick={handleClick}
                marginBottom={
                  index === requiredFixtureDetails.length - 1
                    ? SPACING.spacing68
                    : 'none'
                }
              >
                <Flex flex="4 0 0" alignItems={ALIGN_CENTER}>
                  <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                    {cutoutFixtureId != null && isCurrentFixtureCompatible
                      ? getFixtureDisplayName(cutoutFixtureId)
                      : getFixtureDisplayName(compatibleCutoutFixtureIds?.[0])}
                  </StyledText>
                </Flex>
                <Flex flex="2 0 0" alignItems={ALIGN_CENTER}>
                  <LocationIcon slotName={getCutoutDisplayName(cutoutId)} />
                </Flex>
                <Flex
                  flex="3 0 0"
                  alignItems={ALIGN_CENTER}
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                >
                  {chipLabel}
                </Flex>
              </Flex>
            </React.Fragment>
          )
        }
      )}
    </Flex>
  ) : null
}
