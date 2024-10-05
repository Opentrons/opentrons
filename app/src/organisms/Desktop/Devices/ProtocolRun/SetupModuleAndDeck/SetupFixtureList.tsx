import { useState } from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_FLEX_START,
  BORDERS,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  FLEX_USB_MODULE_ADDRESSABLE_AREAS,
  SINGLE_SLOT_FIXTURES,
  getCutoutDisplayName,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_V2_FRONT_FIXTURE,
  THERMOCYCLER_V2_REAR_FIXTURE,
} from '@opentrons/shared-data'
import { StatusLabel } from '/app/atoms/StatusLabel'
import { TertiaryButton } from '/app/atoms/buttons/TertiaryButton'
import { LocationConflictModal } from '/app/organisms/LocationConflictModal'
import { NotConfiguredModal } from './NotConfiguredModal'
import { getFixtureImage } from './utils'
import { DeckFixtureSetupInstructionsModal } from '/app/organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'

import type { DeckDefinition } from '@opentrons/shared-data'
import type { CutoutConfigAndCompatibility } from '/app/resources/deck_configuration/hooks'

interface SetupFixtureListProps {
  deckConfigCompatibility: CutoutConfigAndCompatibility[]
  robotName: string
}

/**
 * List items of all "non-module" fixtures e.g. staging slot, waste chute, trash bin...
 * @param props
 * @returns JSX.Element
 */
export const SetupFixtureList = (props: SetupFixtureListProps): JSX.Element => {
  const { deckConfigCompatibility, robotName } = props
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  const hasTwoLabwareThermocyclerConflicts =
    deckConfigCompatibility.some(
      ({ cutoutFixtureId, missingLabwareDisplayName }) =>
        cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE &&
        missingLabwareDisplayName != null
    ) &&
    deckConfigCompatibility.some(
      ({ cutoutFixtureId, missingLabwareDisplayName }) =>
        cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE &&
        missingLabwareDisplayName != null
    )

  // if there are two labware conflicts with the thermocycler, don't show the conflict with the thermocycler rear fixture
  const filteredDeckConfigCompatibility = deckConfigCompatibility.filter(
    ({ cutoutFixtureId }) => {
      return (
        !hasTwoLabwareThermocyclerConflicts ||
        !(cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE)
      )
    }
  )

  return (
    <>
      {filteredDeckConfigCompatibility.map(cutoutConfigAndCompatibility => {
        // filter out all fixtures that only provide usb module addressable areas
        // (i.e. everything but MagBlockV1 and StagingAreaWithMagBlockV1)
        // as they're handled in the Modules Table
        return cutoutConfigAndCompatibility.requiredAddressableAreas.every(
          raa => FLEX_USB_MODULE_ADDRESSABLE_AREAS.includes(raa)
        ) ? null : (
          <FixtureListItem
            key={cutoutConfigAndCompatibility.cutoutId}
            deckDef={deckDef}
            robotName={robotName}
            {...cutoutConfigAndCompatibility}
          />
        )
      })}
    </>
  )
}

interface FixtureListItemProps extends CutoutConfigAndCompatibility {
  deckDef: DeckDefinition
  robotName: string
}

export function FixtureListItem({
  cutoutId,
  cutoutFixtureId,
  compatibleCutoutFixtureIds,
  missingLabwareDisplayName,
  deckDef,
  robotName,
}: FixtureListItemProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  const isCurrentFixtureCompatible =
    cutoutFixtureId != null &&
    compatibleCutoutFixtureIds.includes(cutoutFixtureId)
  const isRequiredSingleSlotMissing = missingLabwareDisplayName != null
  const isConflictingFixtureConfigured =
    cutoutFixtureId != null && !SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)

  const isThermocyclerCurrentFixture =
    cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE ||
    cutoutFixtureId === THERMOCYCLER_V2_REAR_FIXTURE

  let statusLabel
  if (!isCurrentFixtureCompatible) {
    statusLabel = (
      <StatusLabel
        status={
          isConflictingFixtureConfigured
            ? t('location_conflict')
            : t('not_configured')
        }
        backgroundColor={COLORS.yellow30}
        iconColor={COLORS.yellow60}
        textColor={COLORS.yellow60}
      />
    )
  } else {
    statusLabel = (
      <StatusLabel
        status={t('configured')}
        backgroundColor={COLORS.green30}
        iconColor={COLORS.green60}
        textColor={COLORS.green60}
      />
    )
  }

  const [
    showLocationConflictModal,
    setShowLocationConflictModal,
  ] = useState<boolean>(false)
  const [showNotConfiguredModal, setShowNotConfiguredModal] = useState<boolean>(
    false
  )

  const [
    showSetupInstructionsModal,
    setShowSetupInstructionsModal,
  ] = useState<boolean>(false)

  return (
    <>
      {showNotConfiguredModal ? (
        <NotConfiguredModal
          onCloseClick={() => {
            setShowNotConfiguredModal(false)
          }}
          cutoutId={cutoutId}
          requiredFixtureId={compatibleCutoutFixtureIds[0]}
        />
      ) : null}
      {showLocationConflictModal ? (
        <LocationConflictModal
          onCloseClick={() => {
            setShowLocationConflictModal(false)
          }}
          cutoutId={cutoutId}
          deckDef={deckDef}
          missingLabwareDisplayName={missingLabwareDisplayName}
          requiredFixtureId={compatibleCutoutFixtureIds[0]}
          robotName={robotName}
        />
      ) : null}
      {showSetupInstructionsModal ? (
        <DeckFixtureSetupInstructionsModal
          setShowSetupInstructionsModal={setShowSetupInstructionsModal}
        />
      ) : null}
      <Box
        border={BORDERS.styleSolid}
        borderColor={COLORS.grey30}
        borderWidth="1px"
        borderRadius={BORDERS.borderRadius4}
        padding={SPACING.spacing16}
        backgroundColor={COLORS.white}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={JUSTIFY_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Flex alignItems={JUSTIFY_CENTER} width="45%">
            {cutoutFixtureId != null ? (
              <img
                width="60px"
                height="54px"
                src={
                  // show the current fixture for a missing single slot
                  isCurrentFixtureCompatible || isRequiredSingleSlotMissing
                    ? getFixtureImage(cutoutFixtureId)
                    : getFixtureImage(compatibleCutoutFixtureIds?.[0])
                }
              />
            ) : null}
            <Flex
              flexDirection={DIRECTION_COLUMN}
              alignItems={ALIGN_FLEX_START}
            >
              <LegacyStyledText
                css={TYPOGRAPHY.pSemiBold}
                marginLeft={SPACING.spacing20}
              >
                {isCurrentFixtureCompatible || isRequiredSingleSlotMissing
                  ? getFixtureDisplayName(cutoutFixtureId)
                  : getFixtureDisplayName(compatibleCutoutFixtureIds?.[0])}
              </LegacyStyledText>
              <Btn
                marginLeft={SPACING.spacing16}
                css={css`
                  color: ${COLORS.blue50};

                  &:hover {
                    color: ${COLORS.blue55};
                  }
                `}
                marginTop={SPACING.spacing4}
                onClick={() => {
                  setShowSetupInstructionsModal(true)
                }}
              >
                <LegacyStyledText marginLeft={SPACING.spacing4} as="p">
                  {t('view_setup_instructions')}
                </LegacyStyledText>
              </Btn>
            </Flex>
          </Flex>
          <LegacyStyledText as="p" width="15%">
            {isThermocyclerCurrentFixture && isRequiredSingleSlotMissing
              ? TC_MODULE_LOCATION_OT3
              : getCutoutDisplayName(cutoutId)}
          </LegacyStyledText>
          <Flex
            width="15%"
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing10}
          >
            {statusLabel}
            {!isCurrentFixtureCompatible ? (
              <TertiaryButton
                width="max-content"
                onClick={() => {
                  isConflictingFixtureConfigured
                    ? setShowLocationConflictModal(true)
                    : setShowNotConfiguredModal(true)
                }}
              >
                <LegacyStyledText as="label" cursor="pointer">
                  {t('resolve')}
                </LegacyStyledText>
              </TertiaryButton>
            ) : null}
          </Flex>
        </Flex>
      </Box>
    </>
  )
}
