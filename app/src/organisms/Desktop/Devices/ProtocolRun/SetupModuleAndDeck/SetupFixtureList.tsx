import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

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
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getCutoutDisplayName,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  SINGLE_SLOT_FIXTURES,
} from '@opentrons/shared-data'

import { TertiaryButton } from '/app/atoms/buttons/TertiaryButton'
import { StatusLabel } from '/app/atoms/StatusLabel'
import { DeckFixtureSetupInstructionsModal } from '/app/organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
import { LocationConflictModal } from '/app/organisms/LocationConflictModal'
import {
  getFilteredDeckConfigFixtureCompatibility,
  isConflictingFixtureConfigured,
  isFixtureCompatible,
} from '/app/organisms/LocationConflictModal/getFilteredDeckConfigFixtureCompatibility'

import { NotConfiguredModal } from './NotConfiguredModal'
import { getFixtureImage } from './utils'

import type { CutoutFixtureId, DeckDefinition } from '@opentrons/shared-data'
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

  const filteredDeckConfigCompatibility = getFilteredDeckConfigFixtureCompatibility(
    deckConfigCompatibility
  )
  return (
    <>
      {filteredDeckConfigCompatibility.map(cutoutConfigAndCompatibility => (
        <FixtureListItem
          key={cutoutConfigAndCompatibility.cutoutId}
          deckDef={deckDef}
          robotName={robotName}
          {...cutoutConfigAndCompatibility}
        />
      ))}
    </>
  )
}

interface FixtureListItemProps extends CutoutConfigAndCompatibility {
  deckDef: DeckDefinition
  robotName: string
  fakeCutoutFixtureId?: CutoutFixtureId
}

export function FixtureListItem({
  cutoutId,
  cutoutFixtureId,
  compatibleCutoutFixtureIds,
  deckDef,
  robotName,
  fakeCutoutFixtureId,
}: FixtureListItemProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')

  const isCurrentFixtureCompatible = isFixtureCompatible(
    cutoutFixtureId,
    compatibleCutoutFixtureIds,
    fakeCutoutFixtureId
  )
  const isRequiredSingleSlotMissing = compatibleCutoutFixtureIds.some(
    fixtureId => SINGLE_SLOT_FIXTURES.includes(fixtureId)
  )

  const hasConflict = isConflictingFixtureConfigured(
    cutoutFixtureId,
    fakeCutoutFixtureId
  )

  let statusLabel
  if (!isCurrentFixtureCompatible) {
    statusLabel = (
      <StatusLabel
        status={hasConflict ? t('location_conflict') : t('not_configured')}
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
          requiredFixtureId={
            fakeCutoutFixtureId ?? compatibleCutoutFixtureIds[0]
          }
        />
      ) : null}
      {showLocationConflictModal ? (
        <LocationConflictModal
          onCloseClick={() => {
            setShowLocationConflictModal(false)
          }}
          cutoutId={cutoutId}
          deckDef={deckDef}
          requiredFixtureId={
            fakeCutoutFixtureId ?? compatibleCutoutFixtureIds[0]
          }
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
                  isCurrentFixtureCompatible || isRequiredSingleSlotMissing
                    ? getFixtureImage(fakeCutoutFixtureId ?? cutoutFixtureId)
                    : getFixtureImage(
                        fakeCutoutFixtureId ?? compatibleCutoutFixtureIds?.[0]
                      )
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
                  ? getFixtureDisplayName(
                      fakeCutoutFixtureId ?? cutoutFixtureId
                    )
                  : getFixtureDisplayName(
                      fakeCutoutFixtureId ?? compatibleCutoutFixtureIds?.[0]
                    )}
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
            {getCutoutDisplayName(cutoutId)}
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
                  hasConflict
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
