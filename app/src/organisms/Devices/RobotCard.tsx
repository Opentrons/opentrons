import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  Box,
  Flex,
  ALIGN_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'
import {
  getGripperDisplayName,
  getModuleDisplayName,
  getPipetteModelSpecs,
} from '@opentrons/shared-data'
import {
  useInstrumentsQuery,
  usePipettesQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import FLEX_PNG from '../../assets/images/FLEX.png'
import { InstrumentContainer } from '../../atoms/InstrumentContainer'
import { StyledText } from '../../atoms/text'
import { CONNECTABLE, getRobotModelByName } from '../../redux/discovery'
import { ModuleIcon } from '../../molecules/ModuleIcon'
import { UpdateRobotBanner } from '../UpdateRobotBanner'
import { useIsOT3 } from './hooks'
import { ReachableBanner } from './ReachableBanner'
import { RobotOverflowMenu } from './RobotOverflowMenu'
import { RobotStatusHeader } from './RobotStatusHeader'

import type { DiscoveredRobot } from '../../redux/discovery/types'
import type { State } from '../../redux/types'

interface RobotCardProps {
  robot: DiscoveredRobot
}

export function RobotCard(props: RobotCardProps): JSX.Element | null {
  const { robot } = props
  const { name: robotName, local } = robot
  const history = useHistory()
  const robotModel = useSelector((state: State) =>
    getRobotModelByName(state, robotName)
  )

  return robot != null ? (
    <Flex
      alignItems={ALIGN_START}
      backgroundColor={COLORS.white}
      cursor="pointer"
      flexDirection={DIRECTION_ROW}
      gridGap={SPACING.spacing16}
      minWidth="36rem"
      padding={SPACING.spacing16}
      position={POSITION_RELATIVE}
      onClick={() => history.push(`/devices/${robotName}`)}
      css={BORDERS.cardOutlineBorder}
    >
      <img
        src={robotModel === 'OT-2' ? OT2_PNG : FLEX_PNG}
        style={{ width: '6rem' }}
        id={`RobotCard_${String(robotName)}_robotImage`}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing12}
        justifyContent={JUSTIFY_FLEX_START}
        width="100%"
      >
        <UpdateRobotBanner robot={robot} marginRight={SPACING.spacing24} />
        <ReachableBanner robot={robot} />
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <RobotStatusHeader
            local={local}
            name={robotName}
            robotModel={robotModel}
            alignItems={ALIGN_START}
            paddingRight={SPACING.spacing24}
          />

          {robot.status === CONNECTABLE ? (
            <Flex
              flexDirection={DIRECTION_ROW}
              flexWrap={WRAP}
              gridGap={SPACING.spacing16}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
            >
              <AttachedInstruments robotName={robotName} />
              <AttachedModules robotName={robotName} />
            </Flex>
          ) : null}
        </Flex>
      </Flex>
      <Box
        position={POSITION_ABSOLUTE}
        top={SPACING.spacing4}
        right={SPACING.spacing4}
      >
        <RobotOverflowMenu robot={robot} alignSelf={ALIGN_START} />
      </Box>
    </Flex>
  ) : null
}

function AttachedModules(props: { robotName: string }): JSX.Element | null {
  const { robotName } = props
  const { t } = useTranslation('devices_landing')
  const {
    data: modulesData,
    isLoading: isModulesQueryLoading,
  } = useModulesQuery()
  const attachedModules = modulesData?.data ?? []

  return !isModulesQueryLoading && attachedModules.length > 0 ? (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
      <StyledText
        as="h6"
        textTransform={TYPOGRAPHY.textTransformUppercase}
        color={COLORS.darkGreyEnabled}
      >
        {t('modules')}
      </StyledText>
      <Flex>
        {attachedModules.map((module, i) => (
          <ModuleIcon
            key={`${String(module.moduleModel)}_${i}_${robotName}`}
            tooltipText={t('this_robot_has_connected_and_power_on_module', {
              moduleName: getModuleDisplayName(module.moduleModel),
            })}
            module={module}
          />
        ))}
      </Flex>
    </Flex>
  ) : null
}

function AttachedInstruments(props: { robotName: string }): JSX.Element {
  const { t } = useTranslation('devices_landing')
  const isOT3 = useIsOT3(props.robotName)
  const {
    data: pipettesData,
    isLoading: isPipetteQueryLoading,
  } = usePipettesQuery()

  const {
    data: attachedInstruments,
    isLoading: isInstrumentsQueryLoading,
  } = useInstrumentsQuery({ enabled: isOT3 })
  const extensionInstrument =
    (attachedInstruments?.data ?? []).find(i => i.mount === 'extension') ?? null
  const leftPipetteModel = pipettesData?.left?.model ?? null
  const rightPipetteModel = pipettesData?.right?.model ?? null
  const extensionMountDisplayName =
    extensionInstrument != null &&
    extensionInstrument.instrumentModel === 'gripperV1'
      ? getGripperDisplayName(extensionInstrument.instrumentModel)
      : null

  // TODO(bh, 2022-11-1): insert actual 96-channel data
  // const leftAndRightMountsPipetteDisplayName = 'P20 96-Channel GEN1'
  const leftAndRightMountsPipetteDisplayName = null

  return (
    <Flex
      flex="1"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      minWidth="24rem"
    >
      <StyledText as="h6" color={COLORS.darkGreyEnabled}>
        {t('shared:instruments')}
      </StyledText>

      {isPipetteQueryLoading || isInstrumentsQueryLoading ? null : (
        <Flex flexWrap={WRAP} gridGap={SPACING.spacing4}>
          {leftAndRightMountsPipetteDisplayName != null ? (
            <InstrumentContainer
              displayName={leftAndRightMountsPipetteDisplayName}
            />
          ) : null}
          {leftPipetteModel != null ? (
            <InstrumentContainer
              displayName={
                getPipetteModelSpecs(leftPipetteModel)?.displayName ?? ''
              }
            />
          ) : null}
          {rightPipetteModel != null ? (
            <InstrumentContainer
              displayName={
                getPipetteModelSpecs(rightPipetteModel)?.displayName ?? ''
              }
            />
          ) : null}
          {extensionMountDisplayName != null ? (
            <InstrumentContainer displayName={extensionMountDisplayName} />
          ) : null}
        </Flex>
      )}
    </Flex>
  )
}
