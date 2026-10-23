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
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'

import { TertiaryButton } from '/app/atoms/buttons/TertiaryButton'
import { StatusLabel } from '/app/atoms/StatusLabel'
import { DeckFixtureSetupInstructionsModal } from '/app/organisms/DeviceDetailsDeckConfiguration/DeckFixtureSetupInstructionsModal'
import { LocationConflictModal } from '/app/organisms/LocationConflictModal'
import { NotConfiguredModal } from '/app/organisms/LocationConflictModal/NotConfiguredModal'
import {
  getFilteredDeckConfigFixtureCompatibility,
  isConflictingFixtureConfigured,
  isFixtureCompatible,
} from '/app/resources/deck_configuration/utils'

import { getFixtureImage } from './utils'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type {
  CutoutConfigAndCompatibility,
  CutoutFixtureId,
  DeckDefinition,
} from '@opentrons/shared-data'

interface SetupFixtureListProps {
  deckConfigCompatibility: CutoutConfigAndCompatibility[]
  robotName: string
}

/**
 * List items of all "non-module" fixtures e.g. staging slot, waste chute, trash bin...
 * @param props
 * @returns JSX.Element
 */
export const SetupFixtureList = (props: SetupFixtureListProps): ReactNode => {
  const { deckConfigCompatibility, robotName } = props
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)

  const filteredDeckConfigCompatibility =
    getFilteredDeckConfigFixtureCompatibility(deckConfigCompatibility)
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
  partialRequiredCutoutFixtureId?: CutoutFixtureId
}

export function FixtureListItem({
  cutoutId,
  cutoutFixtureId,
  compatibleCutoutFixtureIds,
  deckDef,
  robotName,
  partialRequiredCutoutFixtureId,
}: FixtureListItemProps): ReactNode {
  const { t } = useTranslation(['protocol_setup', 'deck_configuration'])

  const isCurrentFixtureCompatible = isFixtureCompatible(
    cutoutFixtureId,
    compatibleCutoutFixtureIds,
    partialRequiredCutoutFixtureId
  )

  const hasConflict = isConflictingFixtureConfigured(
    cutoutFixtureId,
    partialRequiredCutoutFixtureId
  )
  const requiredFixtureId =
    partialRequiredCutoutFixtureId ?? compatibleCutoutFixtureIds[0]
  const fixtureIdToDisplay = isCurrentFixtureCompatible
    ? (partialRequiredCutoutFixtureId ?? cutoutFixtureId)
    : requiredFixtureId
  const fixtureDisplayName = getFixtureDisplayName(
    t as TFunction,
    fixtureIdToDisplay
  )

  let statusLabel
  if (!isCurrentFixtureCompatible) {
    statusLabel = (
      <StatusLabel
        status={
          hasConflict
            ? t('protocol_setup:location_conflict')
            : t('protocol_setup:not_configured')
        }
        backgroundColor={COLORS.yellow30}
        iconColor={COLORS.yellow60}
        textColor={COLORS.yellow60}
      />
    )
  } else {
    statusLabel = (
      <StatusLabel
        status={t('protocol_setup:configured')}
        backgroundColor={COLORS.green30}
        iconColor={COLORS.green60}
        textColor={COLORS.green60}
      />
    )
  }

  const [showLocationConflictModal, setShowLocationConflictModal] =
    useState<boolean>(false)
  const [showNotConfiguredModal, setShowNotConfiguredModal] =
    useState<boolean>(false)

  const [showSetupInstructionsModal, setShowSetupInstructionsModal] =
    useState<boolean>(false)

  const isFourthColumnFixture =
    (partialRequiredCutoutFixtureId != null &&
      STAGING_AREA_RIGHT_SLOT_FIXTURE === partialRequiredCutoutFixtureId) ||
    STAGING_AREA_RIGHT_SLOT_FIXTURE === compatibleCutoutFixtureIds[0]

  const displayLocation = isFourthColumnFixture
    ? `${getCutoutDisplayName(cutoutId).charAt(0)}4`
    : getCutoutDisplayName(cutoutId)

  return (
    <>
      {showNotConfiguredModal ? (
        <NotConfiguredModal
          onCloseClick={() => {
            setShowNotConfiguredModal(false)
          }}
          cutoutId={cutoutId}
          requiredFixtureId={requiredFixtureId}
        />
      ) : null}
      {showLocationConflictModal ? (
        <LocationConflictModal
          onCloseClick={() => {
            setShowLocationConflictModal(false)
          }}
          cutoutId={cutoutId}
          deckDef={deckDef}
          requiredFixtureId={requiredFixtureId}
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
                  isCurrentFixtureCompatible
                    ? getFixtureImage(
                        partialRequiredCutoutFixtureId ?? cutoutFixtureId
                      )
                    : getFixtureImage(requiredFixtureId)
                }
                alt={`Image of a ${fixtureDisplayName}`}
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
                {fixtureDisplayName}
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
                <LegacyStyledText marginLeft={SPACING.spacing4} forwardedAs="p">
                  {t('protocol_setup:view_setup_instructions')}
                </LegacyStyledText>
              </Btn>
            </Flex>
          </Flex>
          <LegacyStyledText forwardedAs="p" width="15%">
            {displayLocation}
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
                <LegacyStyledText forwardedAs="label" cursor="pointer">
                  {t('protocol_setup:resolve')}
                </LegacyStyledText>
              </TertiaryButton>
            ) : null}
          </Flex>
        </Flex>
      </Box>
    </>
  )
}
