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
import {
  useDeckConfigurationQuery,
  useModulesQuery,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'
import {
  getCutoutDisplayName,
  getFixtureDisplayName,
  SINGLE_RIGHT_CUTOUTS,
  SINGLE_SLOT_FIXTURES,
  SINGLE_LEFT_SLOT_FIXTURE,
  SINGLE_RIGHT_SLOT_FIXTURE,
  SINGLE_CENTER_SLOT_FIXTURE,
  SINGLE_LEFT_CUTOUTS,
  getDeckDefFromRobotType,
  FLEX_ROBOT_TYPE,
  SINGLE_CENTER_CUTOUTS,
  getFixtureGroupForCutoutFixture,
} from '@opentrons/shared-data'

import { useNotifyCurrentMaintenanceRun } from '../../resources/maintenance_runs'
import { Banner } from '../../atoms/Banner'
import { DeckFixtureSetupInstructionsModal } from './DeckFixtureSetupInstructionsModal'
import { AddFixtureModal } from './AddFixtureModal'
import { useIsRobotViewable, useRunStatuses } from '../Devices/hooks'
import { useIsEstopNotDisengaged } from '../../resources/devices/hooks/useIsEstopNotDisengaged'

import type { CutoutConfig, CutoutFixtureId, CutoutId, DeckConfiguration } from '@opentrons/shared-data'

const DECK_CONFIG_REFETCH_INTERVAL = 5000
const RUN_REFETCH_INTERVAL = 5000

interface DeviceDetailsDeckConfigurationProps {
  robotName: string
}

function getDisplayLocationForFixtureGroup(cutouts: CutoutId[]): string {
  return cutouts.map(cutoutId => getCutoutDisplayName(cutoutId)).join(" + ")
}

export function DeviceDetailsDeckConfiguration({
  robotName,
}: DeviceDetailsDeckConfigurationProps): JSX.Element | null {
  const { t } = useTranslation('device_details')
  const [
    showSetupInstructionsModal,
    setShowSetupInstructionsModal,
  ] = React.useState<boolean>(false)
  const [showAddFixtureModal, setShowAddFixtureModal] = React.useState<boolean>(
    false
  )
  const [targetCutoutId, setTargetCutoutId] = React.useState<CutoutId | null>(
    null
  )

  const { data: modulesData } = useModulesQuery()
  const deckConfig =
    useDeckConfigurationQuery({ refetchInterval: DECK_CONFIG_REFETCH_INTERVAL })
      .data ?? []
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation()
  const { isRunRunning } = useRunStatuses()
  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
  })
  const isEstopNotDisengaged = useIsEstopNotDisengaged(robotName)
  const isMaintenanceRunExisting = maintenanceRunData?.data?.id != null
  const isRobotViewable = useIsRobotViewable(robotName)

  const handleClickAdd = (cutoutId: CutoutId): void => {
    setTargetCutoutId(cutoutId)
    setShowAddFixtureModal(true)
  }

  const handleClickRemove = (cutoutId: CutoutId, cutoutFixtureId: CutoutFixtureId): void => {
    let replacementFixtureId: CutoutFixtureId = SINGLE_CENTER_SLOT_FIXTURE
    if (SINGLE_RIGHT_CUTOUTS.includes(cutoutId)) {
      replacementFixtureId = SINGLE_RIGHT_SLOT_FIXTURE
    } else if (SINGLE_LEFT_CUTOUTS.includes(cutoutId)) {
      replacementFixtureId = SINGLE_LEFT_SLOT_FIXTURE
    }

    const fixtureGroup = deckDef.cutoutFixtures.find(cf => cf.id === cutoutFixtureId)?.fixtureGroup ?? []

    let newDeckConfig = deckConfig
    if (fixtureGroup.length > 0) {
      newDeckConfig = deckConfig.map(cutoutConfig => (
        fixtureGroup.includes(cutoutConfig.cutoutFixtureId)
          ? {
            ...cutoutConfig,
            cutoutFixtureId: replacementFixtureId,
            opentronsModuleSerialNumber: undefined,
          }
          : cutoutConfig
      ))
    } else {
      newDeckConfig = deckConfig.map(cutoutConfig => (
        cutoutConfig.cutoutId === cutoutId
          ? {
            ...cutoutConfig,
            cutoutFixtureId: replacementFixtureId,
            opentronsModuleSerialNumber: undefined,
          }
          : cutoutConfig
      ))
    }
    updateDeckConfiguration(newDeckConfig)
  }

  // do not show standard slot in fixture display list
  const { displayList: fixtureDisplayList } = deckConfig.reduce<{ displayList: { displayLocation: string, displayName: string }[], groupedCutoutIds: CutoutId[] }>(
    (acc, { cutoutId, cutoutFixtureId, opentronsModuleSerialNumber }) => {
      if (cutoutFixtureId == null || SINGLE_SLOT_FIXTURES.includes(cutoutFixtureId)) {
        return acc
      }
      const displayName = getFixtureDisplayName(cutoutFixtureId, modulesData?.data.find(m => m.serialNumber === opentronsModuleSerialNumber)?.usbPort.port)
      const fixtureGroup = getFixtureGroupForCutoutFixture(cutoutFixtureId, deckDef.cutoutFixtures)
      if (fixtureGroup.length > 1) {
        const groupedCutoutIds = fixtureGroup.map(groupedFixtureId => deckConfig.find(cc => cc.cutoutFixtureId === groupedFixtureId)?.cutoutId).filter((cc): cc is CutoutId => cc !== null)
        const displayLocation = getDisplayLocationForFixtureGroup(groupedCutoutIds)
        if (acc.groupedCutoutIds.includes(cutoutId)) {
          return acc // only list grouped fixtures once
        } else {
          return {
            displayList: [...acc.displayList, { displayLocation, displayName }],
            groupedCutoutIds: [...acc.groupedCutoutIds, ...groupedCutoutIds]
          }
        }
      }
      return {
        ...acc,
        displayList: [...acc.displayList, { displayLocation: getDisplayLocationForFixtureGroup([cutoutId]), displayName }]
      }
    }, { displayList: [], groupedCutoutIds: [] })

  return (
    <>
      {showAddFixtureModal && targetCutoutId != null ? (
        <AddFixtureModal
          cutoutId={targetCutoutId}
          setShowAddFixtureModal={setShowAddFixtureModal}
        />
      ) : null}
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
          <StyledText
            as="h3"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            id="DeckConfiguration_title"
          >
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
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                marginLeft={`-${SPACING.spacing32}`}
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                marginTop={`-${SPACING.spacing6}`}
                flexDirection={DIRECTION_COLUMN}
              >
                <DeckConfigurator
                  readOnly={
                    isRunRunning ||
                    isMaintenanceRunExisting ||
                    isEstopNotDisengaged
                  }
                  deckConfig={deckConfig}
                  handleClickAdd={handleClickAdd}
                  handleClickRemove={handleClickRemove}
                />
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing8}
                width="32rem"
              >
                <Flex
                  gridGap={SPACING.spacing32}
                  paddingLeft={SPACING.spacing8}
                  css={TYPOGRAPHY.labelSemiBold}
                >
                  <StyledText>{t('location')}</StyledText>
                  <StyledText>{t('fixture')}</StyledText>
                </Flex>
                {fixtureDisplayList.length > 0 ? (
                  fixtureDisplayList.map(({ displayLocation, displayName }) => (
                    <Flex
                      key={displayLocation}
                      backgroundColor={COLORS.grey20}
                      borderRadius={BORDERS.borderRadius4}
                      gridGap={SPACING.spacing60}
                      padding={SPACING.spacing8}
                      width="100%"
                      css={TYPOGRAPHY.labelRegular}
                    >
                      <StyledText>{displayLocation}</StyledText>
                      <StyledText>{displayName}</StyledText>
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
            <StyledText
              as="p"
              color={COLORS.grey40}
              id="InstrumentsAndModules_offline"
            >
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
