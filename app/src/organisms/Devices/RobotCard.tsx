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
import { getModuleDisplayName } from '@opentrons/shared-data'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import OT3_PNG from '../../assets/images/OT3.png'
import { InstrumentContainer } from '../../atoms/InstrumentContainer'
import { StyledText } from '../../atoms/text'
import { useFeatureFlag } from '../../redux/config'
import { CONNECTABLE, getRobotModelByName } from '../../redux/discovery'
import { ModuleIcon } from '../../molecules/ModuleIcon'
import { UpdateRobotBanner } from '../UpdateRobotBanner'
import { useAttachedModules, useAttachedPipettes, useIsOT3 } from './hooks'
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
      gridGap={SPACING.spacing4}
      minWidth="36rem"
      padding={SPACING.spacing4}
      position={POSITION_RELATIVE}
      onClick={() => history.push(`/devices/${robotName}`)}
      css={BORDERS.cardOutlineBorder}
    >
      <img
        src={robotModel === 'OT-2' ? OT2_PNG : OT3_PNG}
        style={{ width: '6rem' }}
        id={`RobotCard_${robotName}_robotImage`}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacingSM}
        justifyContent={JUSTIFY_FLEX_START}
        width="100%"
      >
        <UpdateRobotBanner robot={robot} marginRight={SPACING.spacing5} />
        <ReachableBanner robot={robot} />
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <RobotStatusHeader
            local={local}
            name={robotName}
            robotModel={robotModel}
            alignItems={ALIGN_START}
            paddingRight={SPACING.spacing5}
          />
          {robot.status === CONNECTABLE ? (
            <Flex
              flexDirection={DIRECTION_ROW}
              flexWrap={WRAP}
              gridGap={SPACING.spacing4}
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
        top={SPACING.spacing2}
        right={SPACING.spacing2}
      >
        <RobotOverflowMenu robot={robot} alignSelf={ALIGN_START} />
      </Box>
    </Flex>
  ) : null
}

function AttachedModules(props: { robotName: string }): JSX.Element | null {
  const { robotName } = props
  const { t } = useTranslation('devices_landing')
  const attachedModules = useAttachedModules()
  const enableThermocyclerGen2 = useFeatureFlag('enableThermocyclerGen2')

  return attachedModules.length > 0 ? (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
      <StyledText
        as="h6"
        textTransform={TYPOGRAPHY.textTransformUppercase}
        color={COLORS.darkGreyEnabled}
      >
        {t('modules')}
      </StyledText>
      <Flex>
        {attachedModules.map((module, i) =>
          //  TODO(jr, 9/28/22): remove this logic when we remove enableThermocyclerGen2 FF
          enableThermocyclerGen2 ||
          (!enableThermocyclerGen2 &&
            module.moduleModel !== 'thermocyclerModuleV2') ? (
            <ModuleIcon
              key={`${module.moduleModel}_${i}_${robotName}`}
              tooltipText={t('this_robot_has_connected_and_power_on_module', {
                moduleName: getModuleDisplayName(module.moduleModel),
              })}
              module={module}
            />
          ) : null
        )}
      </Flex>
    </Flex>
  ) : null
}
function AttachedInstruments(props: { robotName: string }): JSX.Element {
  const { robotName } = props
  const { t } = useTranslation('devices_landing')
  const attachedPipettes = useAttachedPipettes()

  const leftPipetteDisplayName = attachedPipettes?.left?.modelSpecs.displayName
  const rightPipetteDisplayName =
    attachedPipettes?.right?.modelSpecs.displayName

  const isOT3 = useIsOT3(robotName)

  // TODO(bh, 2022-11-1): insert actual gripper data
  const extensionMountDisplayName = isOT3 ? 'Gripper GEN1' : null

  // TODO(bh, 2022-11-1): insert actual 96-channel data
  // const leftAndRightMountsPipetteDisplayName = 'P20 96-Channel GEN1'
  const leftAndRightMountsPipetteDisplayName = null

  return (
    <Flex
      flex="1"
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing2}
      minWidth="24rem"
    >
      <StyledText as="h6" color={COLORS.darkGreyEnabled}>
        {t('shared:instruments')}
      </StyledText>
      <Flex flexWrap={WRAP} gridGap={SPACING.spacing2}>
        {leftAndRightMountsPipetteDisplayName != null ? (
          <InstrumentContainer
            displayName={leftAndRightMountsPipetteDisplayName}
            id={`RobotCard_${robotName}_leftAndRightMountsPipette`}
          />
        ) : null}
        {leftPipetteDisplayName != null ? (
          <InstrumentContainer
            displayName={leftPipetteDisplayName}
            id={`RobotCard_${robotName}_leftMountPipette`}
          />
        ) : null}
        {rightPipetteDisplayName != null ? (
          <InstrumentContainer
            displayName={rightPipetteDisplayName}
            id={`RobotCard_${robotName}_rightMountPipette`}
          />
        ) : null}
        {extensionMountDisplayName != null ? (
          <InstrumentContainer
            displayName={extensionMountDisplayName}
            id={`RobotCard_${robotName}_extensionMount`}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
