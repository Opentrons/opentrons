import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  Banner,
  BORDERS,
  COLORS,
  DeckConfigurator,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  InfoScreen,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  Link,
  SIZE_4,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FAKE_STAGING_AREA_RIGHT_SLOT,
  FLEX_ROBOT_TYPE,
  getAAByAAId,
  getAAComboFixtureDisplayName,
  getAASlotDisplayName,
  getAAWithFakesFromVSId,
  getCutoutDisplayName,
  getDeckDefFromRobotType,
  getFixtureDisplayName,
  getJoinedVisualSlotDisplayNamesForFixture,
  getVisualSlotIdForAA,
  replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA,
  SINGLE_SLOT_FIXTURES,
  VACUUM_MODULE_V1_FIXTURE,
} from '@opentrons/shared-data'

import { useIsRobotViewable } from '/app/redux-resources/robots'
import {
  useDeckConfigurationEditingTools,
  useNotifyDeckConfigurationQuery,
} from '/app/resources/deck_configuration'
import { useIsEstopNotDisengaged } from '/app/resources/devices/hooks/useIsEstopNotDisengaged'
import { useNotifyCurrentMaintenanceRun } from '/app/resources/maintenance_runs'
import { useRunStatuses } from '/app/resources/runs'

import { DeckFixtureSetupInstructionsModal } from './DeckFixtureSetupInstructionsModal'

import type { TFunction } from 'i18next'
import type { CutoutId, VISUAL_SLOTS } from '@opentrons/shared-data'

const DECK_CONFIG_REFETCH_INTERVAL = 5000
const RUN_REFETCH_INTERVAL = 5000

interface DeviceDetailsDeckConfigurationProps {
  robotName: string
}

function getDisplayLocationForCutoutIds(cutouts: CutoutId[]): string {
  return cutouts.map(cutoutId => getCutoutDisplayName(cutoutId)).join(' + ')
}

export function DeviceDetailsDeckConfiguration({
  robotName,
}: DeviceDetailsDeckConfigurationProps): JSX.Element | null {
  const { t, i18n } = useTranslation(['device_details', 'deck_configuration'])
  const [showSetupInstructionsModal, setShowSetupInstructionsModal] =
    useState<boolean>(false)

  // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const deckConfig =
    useNotifyDeckConfigurationQuery({
      refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
    }).data ?? []

  const deckConfigWithAA = useMemo(
    () => replaceFixtureToFakeFixtureAndTransformCutoutFixturesToAA(deckConfig),
    [deckConfig]
  )
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const { isRunRunning } = useRunStatuses()
  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
  })
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)
  const isMaintenanceRunExisting = maintenanceRunData?.data?.id != null
  const isRobotViewable = useIsRobotViewable(robotName)

  const { addFixtureToCutout, removeFixtureFromCutout, addFixtureModal } =
    useDeckConfigurationEditingTools(false)

  // do not show standard slot in fixture display list
  const { displayList: fixtureDisplayList } = deckConfigWithAA.reduce<{
    displayList: Array<{ displayLocation: string; displayName: string }>
    groupedCutoutIds: CutoutId[]
  }>(
    (acc, { cutoutId, cutoutFixtureId, addressableAreaId }) => {
      const areaInCheck = getAAByAAId(addressableAreaId, deckDef)
      const shouldShowAA =
        areaInCheck.areaType !== 'slot' &&
        areaInCheck.areaType !== 'fakeStagingSlot'
      if (
        cutoutFixtureId == null ||
        SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId) ||
        FAKE_STAGING_AREA_RIGHT_SLOT === cutoutFixtureId ||
        !shouldShowAA
      ) {
        return acc
      }
      const displayName =
        getAAComboFixtureDisplayName(
          cutoutFixtureId,
          addressableAreaId,
          deckDef,
          t as TFunction
        ) ?? getFixtureDisplayName(t as TFunction, cutoutFixtureId)
      const fixtureGroup =
        deckDef.cutoutFixtures.find(cf => cf.id === cutoutFixtureId)
          ?.fixtureGroup ?? {}
      if (cutoutId in fixtureGroup) {
        const groupMap =
          fixtureGroup[cutoutId]?.find(group =>
            Object.entries(group).every(([cId, cfId]) =>
              deckConfig.find(
                config =>
                  config.cutoutId === cId && config.cutoutFixtureId === cfId
              )
            )
          ) ?? {}
        const groupedCutoutIds = Object.keys(groupMap) as CutoutId[]
        const displayLocation = getDisplayLocationForCutoutIds(groupedCutoutIds)
        if (acc.groupedCutoutIds.includes(cutoutId)) {
          return acc // only list grouped fixtures once
        } else {
          return {
            displayList: [...acc.displayList, { displayLocation, displayName }],
            groupedCutoutIds: [...acc.groupedCutoutIds, ...groupedCutoutIds],
          }
        }
      }
      if (cutoutFixtureId === VACUUM_MODULE_V1_FIXTURE) {
        return {
          ...acc,
          displayList: [
            ...acc.displayList,
            {
              displayLocation: getJoinedVisualSlotDisplayNamesForFixture(
                deckDef,
                cutoutFixtureId,
                cutoutId
              ),
              displayName,
            },
          ],
        }
      }
      const vsId = getVisualSlotIdForAA(
        cutoutId,
        cutoutFixtureId,
        addressableAreaId
      )

      return {
        ...acc,
        displayList: [
          ...acc.displayList,
          {
            displayLocation: vsId
              ? getAASlotDisplayName(
                  getAAWithFakesFromVSId(vsId as VISUAL_SLOTS) ??
                    addressableAreaId
                )
              : getDisplayLocationForCutoutIds([cutoutId]),
            displayName,
          },
        ],
      }
    },
    { displayList: [], groupedCutoutIds: [] }
  )

  return (
    <>
      {addFixtureModal}
      {showSetupInstructionsModal ? (
        <DeckFixtureSetupInstructionsModal
          setShowSetupInstructionsModal={setShowSetupInstructionsModal}
        />
      ) : null}
      <Flex
        alignItems={ALIGN_FLEX_START}
        backgroundColor={COLORS.white}
        borderRadius={BORDERS.borderRadius8}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        width="100%"
        marginBottom={SPACING.spacing16}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={SPACING.spacing16}
          width="100%"
          borderBottom={BORDERS.lineBorder}
        >
          <StyledText desktopStyle="bodyLargeSemiBold">
            {t('deck_configuration', { robotName })}
          </StyledText>
          <Link
            role="button"
            css={TYPOGRAPHY.linkPSemiBold}
            onClick={() => {
              setShowSetupInstructionsModal(true)
            }}
          >
            {t('setup_instructions')}
          </Link>
        </Flex>
        {isRobotViewable ? (
          <Flex
            gridGap={SPACING.spacing16}
            paddingX={SPACING.spacing16}
            paddingBottom={SPACING.spacing32}
            paddingTop={
              isRunRunning || isMaintenanceRunExisting
                ? undefined
                : SPACING.spacing32
            }
            width="100%"
            flexDirection={DIRECTION_COLUMN}
          >
            {isRunRunning ? (
              <Banner type="warning">
                {t(
                  'deck_configuration_is_not_available_when_run_is_in_progress'
                )}
              </Banner>
            ) : null}
            {isMaintenanceRunExisting ? (
              <Banner type="warning">
                {t('deck_configuration_is_not_available_when_robot_is_busy')}
              </Banner>
            ) : null}
            <Flex css={DECK_CONFIG_SECTION_STYLE}>
              <Flex
                marginLeft={`-${SPACING.spacing32}`}
                marginTop={`-${SPACING.spacing6}`}
                flexDirection={DIRECTION_COLUMN}
              >
                <DeckConfigurator
                  editableCutoutIds={
                    isRunRunning ||
                    isMaintenanceRunExisting ||
                    isEstopNotDisengaged
                      ? []
                      : deckConfig.map(({ cutoutId }) => cutoutId)
                  }
                  deckConfig={deckConfig}
                  handleClickAdd={addFixtureToCutout}
                  handleClickRemove={removeFixtureFromCutout}
                />
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing8}
                width="32rem"
              >
                <Flex
                  paddingLeft={SPACING.spacing8}
                  gridGap={SPACING.spacing8}
                  css={TYPOGRAPHY.labelSemiBold}
                >
                  <LegacyStyledText flex="1 0 30px">
                    {t('location')}
                  </LegacyStyledText>
                  <LegacyStyledText flex="9 1 0">
                    {i18n.format(t('deck_hardware'), 'capitalize')}
                  </LegacyStyledText>
                </Flex>
                {fixtureDisplayList.length > 0 ? (
                  fixtureDisplayList.map(({ displayLocation, displayName }) => (
                    <Flex
                      key={displayLocation}
                      backgroundColor={COLORS.grey20}
                      borderRadius={BORDERS.borderRadius4}
                      gridGap={SPACING.spacing8}
                      padding={SPACING.spacing8}
                      width="100%"
                      css={TYPOGRAPHY.labelRegular}
                    >
                      <LegacyStyledText flex="1 0 30px">
                        {displayLocation}
                      </LegacyStyledText>
                      <LegacyStyledText flex="9 1 0">
                        {displayName}
                      </LegacyStyledText>
                    </Flex>
                  ))
                ) : (
                  <Flex
                    backgroundColor={COLORS.grey20}
                    gridGap={SPACING.spacing60}
                    padding={SPACING.spacing8}
                    width="100%"
                    css={TYPOGRAPHY.labelRegular}
                  >
                    <LegacyStyledText>{t('no_deck_fixtures')}</LegacyStyledText>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Flex>
        ) : (
          <Flex
            alignItems={ALIGN_CENTER}
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing12}
            justifyContent={JUSTIFY_CENTER}
            minHeight={SIZE_4}
            padding={SPACING.spacing12}
            paddingBottom={SPACING.spacing24}
            width="100%"
          >
            <InfoScreen content={t('offline_deck_configuration')} />
          </Flex>
        )}
      </Flex>
    </>
  )
}

const DECK_CONFIG_SECTION_STYLE = css`
  flex-direction: ${DIRECTION_ROW};
  grid-gap: ${SPACING.spacing40};
  @media screen and (max-width: 1024px) {
    flex-direction: ${DIRECTION_COLUMN};
    align-items: ${ALIGN_CENTER};
    grid-gap: ${SPACING.spacing32};
  }
`
