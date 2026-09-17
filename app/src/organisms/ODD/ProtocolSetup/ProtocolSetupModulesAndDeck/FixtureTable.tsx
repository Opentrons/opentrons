import { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  BORDERS,
  Chip,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  RobotInfoLabel,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getCutoutDisplayName,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
} from '@opentrons/shared-data'

import { SmallButton } from '/app/atoms/buttons'
import { LocationConflictModal } from '/app/organisms/LocationConflictModal'
import { NotConfiguredModal } from '/app/organisms/LocationConflictModal/NotConfiguredModal'
import { getLocalRobot } from '/app/redux/discovery'
import {
  getFilteredDeckConfigFixtureCompatibility,
  getRequiredDeckConfig,
  isConflictingFixtureConfigured,
  isFixtureCompatible,
} from '/app/resources/deck_configuration/utils'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type {
  CutoutConfigAndCompatibility,
  CutoutFixtureId,
  DeckDefinition,
  RobotType,
} from '@opentrons/shared-data'

interface FixtureTableProps {
  robotType: RobotType
  deckConfigCompatibility: CutoutConfigAndCompatibility[]
}

/**
 * Table of all "non-module" fixtures e.g. staging slot, waste chute, trash bin...
 * @param props
 * @returns JSX.Element
 */
export function FixtureTable({
  robotType,
  deckConfigCompatibility,
}: FixtureTableProps): JSX.Element | null {
  const deckDef = getDeckDefFromRobotType(robotType)
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : ''

  const requiredDeckConfigCompatibility = getRequiredDeckConfig(
    deckConfigCompatibility
  )

  const filteredDeckConfigCompatibility =
    getFilteredDeckConfigFixtureCompatibility(requiredDeckConfigCompatibility)

  // list not configured/conflicted fixtures first
  const sortedDeckConfigCompatibility = filteredDeckConfigCompatibility.sort(
    a =>
      a.cutoutFixtureId != null &&
      a.compatibleCutoutFixtureIds.includes(a.cutoutFixtureId)
        ? 1
        : -1
  )

  return sortedDeckConfigCompatibility.length > 0 ? (
    <>
      {sortedDeckConfigCompatibility.map((fixtureCompatibility, index) => {
        return (
          <FixtureTableItem
            key={`FixtureTableItem_${index}`}
            {...fixtureCompatibility}
            lastItem={index === sortedDeckConfigCompatibility.length - 1}
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
  deckDef: DeckDefinition
  robotName: string
  partialRequiredCutoutFixtureId?: CutoutFixtureId
}

function FixtureTableItem({
  cutoutId,
  cutoutFixtureId,
  compatibleCutoutFixtureIds,
  lastItem,
  deckDef,
  robotName,
  partialRequiredCutoutFixtureId,
}: FixtureTableItemProps): ReactNode {
  const { t, i18n } = useTranslation(['protocol_setup', 'deck_configuration'])

  const [showLocationConflictModal, setShowLocationConflictModal] =
    useState<boolean>(false)
  const [showNotConfiguredModal, setShowNotConfiguredModal] =
    useState<boolean>(false)
  const isCurrentFixtureCompatible = isFixtureCompatible(
    cutoutFixtureId,
    compatibleCutoutFixtureIds,
    partialRequiredCutoutFixtureId
  )
  const isFourthColumnFixture =
    (partialRequiredCutoutFixtureId != null &&
      STAGING_AREA_RIGHT_SLOT_FIXTURE === partialRequiredCutoutFixtureId) ||
    STAGING_AREA_RIGHT_SLOT_FIXTURE === compatibleCutoutFixtureIds[0]

  const displayLocation = isFourthColumnFixture
    ? `${getCutoutDisplayName(cutoutId).charAt(0)}4`
    : getCutoutDisplayName(cutoutId)

  let chipLabel: JSX.Element
  if (!isCurrentFixtureCompatible) {
    const hasConflict = isConflictingFixtureConfigured(
      cutoutFixtureId,
      partialRequiredCutoutFixtureId
    )

    chipLabel = (
      <>
        <Chip
          text={
            hasConflict
              ? i18n.format(t('location_conflict'), 'capitalize')
              : i18n.format(t('not_configured'), 'capitalize')
          }
          type="warning"
          background={false}
          iconName="connection-status"
        />
        <SmallButton
          buttonCategory="rounded"
          buttonText={hasConflict ? t('resolve') : t('configure')}
          onClick={
            hasConflict
              ? () => {
                  setShowLocationConflictModal(true)
                }
              : () => {
                  setShowNotConfiguredModal(true)
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
    <Fragment key={cutoutId}>
      {showNotConfiguredModal ? (
        <NotConfiguredModal
          onCloseClick={() => {
            setShowNotConfiguredModal(false)
          }}
          cutoutId={cutoutId}
          requiredFixtureId={
            partialRequiredCutoutFixtureId ?? compatibleCutoutFixtureIds[0]
          }
          isOnDevice
        />
      ) : null}
      {showLocationConflictModal ? (
        <LocationConflictModal
          onCloseClick={() => {
            setShowLocationConflictModal(false)
          }}
          cutoutId={cutoutId}
          requiredFixtureId={
            partialRequiredCutoutFixtureId ?? compatibleCutoutFixtureIds[0]
          }
          isOnDevice={true}
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
          <LegacyStyledText
            forwardedAs="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {cutoutFixtureId != null && isCurrentFixtureCompatible
              ? getFixtureDisplayName(
                  t as TFunction,
                  partialRequiredCutoutFixtureId ?? cutoutFixtureId
                )
              : getFixtureDisplayName(
                  t as TFunction,
                  partialRequiredCutoutFixtureId ??
                    compatibleCutoutFixtureIds?.[0]
                )}
          </LegacyStyledText>
        </Flex>
        <Flex flex="2 0 0" alignItems={ALIGN_CENTER}>
          <RobotInfoLabel deckLabel={displayLocation} />
        </Flex>
        <Flex
          flex="4 0 0"
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          {chipLabel}
        </Flex>
      </Flex>
    </Fragment>
  )
}
