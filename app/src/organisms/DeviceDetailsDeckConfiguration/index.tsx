import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DeckConfigurator,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SIZE_4,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useModulesQuery } from '@opentrons/react-api-client'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
  SINGLE_SLOT_FIXTURES,
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
} from '@opentrons/shared-data'

import { useNotifyCurrentMaintenanceRun } from '../../resources/maintenance_runs'
import { Banner } from '../../atoms/Banner'
import { DeckFixtureSetupInstructionsModal } from './DeckFixtureSetupInstructionsModal'
import { useIsRobotViewable, useRunStatuses } from '../Devices/hooks'
import { useIsEstopNotDisengaged } from '../../resources/devices/hooks/useIsEstopNotDisengaged'
import {
  useDeckConfigurationEditingTools,
  useNotifyDeckConfigurationQuery,
} from '../../resources/deck_configuration'

import type { CutoutId } from '@opentrons/shared-data'

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
  const { t, i18n } = useTranslation('device_details')
  const [
    showSetupInstructionsModal,
    setShowSetupInstructionsModal,
  ] = React.useState<boolean>(false)

  const { data: modulesData } = useModulesQuery()
  const deckConfig =
    useNotifyDeckConfigurationQuery({
      refetchInterval: DECK_CONFIG_REFETCH_INTERVAL,
    }).data ?? []
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const { isRunRunning } = useRunStatuses()
  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
  })
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)
  const isMaintenanceRunExisting = maintenanceRunData?.data?.id != null
  const isRobotViewable = useIsRobotViewable(robotName)

  const {
    addFixtureToCutout,
    removeFixtureFromCutout,
    addFixtureModal,
  } = useDeckConfigurationEditingTools(false)

  // do not show standard slot in fixture display list
  const { displayList: fixtureDisplayList } = deckConfig.reduce<{
    displayList: Array<{ displayLocation: string; displayName: string }>
    groupedCutoutIds: CutoutId[]
  }>(
    (acc, { cutoutId, cutoutFixtureId, opentronsModuleSerialNumber }) => {
      if (
        cutoutFixtureId == null ||
        SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)
      ) {
        return acc
      }
      const displayName = getFixtureDisplayName(
        cutoutFixtureId,
        modulesData?.data.find(
          m => m.serialNumber === opentronsModuleSerialNumber
        )?.usbPort.port
      )
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
      return {
        ...acc,
        displayList: [
          ...acc.displayList,
          {
            displayLocation: getDisplayLocationForCutoutIds([cutoutId]),
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
          <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
            {`${robotName} ${t('deck_configuration')}`}
          </StyledText>
          <Link
            role="button"
            css={TYPOGRAPHY.linkPSemiBold}
            onClick={() => setShowSetupInstructionsModal(true)}
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
                  <StyledText flex="1 0 30px">{t('location')}</StyledText>
                  <StyledText flex="9 1 0">
                    {i18n.format(t('deck_hardware'), 'capitalize')}
                  </StyledText>
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
                      <StyledText flex="1 0 30px">{displayLocation}</StyledText>
                      <StyledText flex="9 1 0">{displayName}</StyledText>
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
                    <StyledText>{t('no_deck_fixtures')}</StyledText>
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
            <StyledText as="p" color={COLORS.grey40}>
              {t('offline_deck_configuration')}
            </StyledText>
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
