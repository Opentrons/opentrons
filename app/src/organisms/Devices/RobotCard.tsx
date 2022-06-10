import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'

import {
  Box,
  Flex,
  Icon,
  ALIGN_CENTER,
  ALIGN_START,
  SIZE_1,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  COLORS,
  TEXT_TRANSFORM_UPPERCASE,
  BORDERS,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'
import { CONNECTABLE, UNREACHABLE } from '../../redux/discovery'
import { ModuleIcon } from '../../molecules/ModuleIcon'
import { useCurrentRunId } from '../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../organisms/RunTimeControl/hooks'
import { UpdateRobotBanner } from '../UpdateRobotBanner'
import {
  useAttachedModules,
  useAttachedPipettes,
  useIsRobotBusy,
  useProtocolDetailsForRun,
} from './hooks'
import { ReachableBanner } from './ReachableBanner'
import { RobotOverflowMenu } from './RobotOverflowMenu'

import type { DiscoveredRobot } from '../../redux/discovery/types'

interface RobotCardProps {
  robot: DiscoveredRobot
}

export function RobotCard(props: RobotCardProps): JSX.Element | null {
  const { robot } = props
  const { name: robotName = null, local } = robot
  const history = useHistory()
  const isRobotBusy = useIsRobotBusy()
  return robotName != null ? (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.white}
      border={`1px solid ${COLORS.medGrey}`}
      borderRadius={BORDERS.radiusSoftCorners}
      flexDirection={DIRECTION_ROW}
      marginBottom={SPACING.spacing3}
      padding={`${SPACING.spacing3} ${SPACING.spacing2} ${SPACING.spacing3} ${SPACING.spacing3}`}
      width="100%"
      onClick={() => history.push(`/devices/${robotName}`)}
      cursor="pointer"
    >
      <img
        src={OT2_PNG}
        style={{ width: '6rem' }}
        id={`RobotCard_${robotName}_robotImage`}
      />
      <Box padding={SPACING.spacing3} width="100%">
        {!isRobotBusy ? (
          <UpdateRobotBanner robot={robot} marginBottom={SPACING.spacing3} />
        ) : null}
        <ReachableBanner robot={robot} />
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText
              as="h6"
              paddingBottom={SPACING.spacing1}
              id={`RobotStatusBanner_${robotName}_robotModel`}
            >
              {/* robot_model can be seen in the health response, but only for "connectable" robots. Probably best to leave as "OT-2" for now */}
              OT-2
            </StyledText>
            <Flex alignItems={ALIGN_CENTER} paddingBottom={SPACING.spacing4}>
              <Flex alignItems={ALIGN_CENTER}>
                <StyledText
                  as="h3"
                  marginRight={SPACING.spacing4}
                  id={`RobotStatusBanner_${robotName}_robotName`}
                >
                  {robotName}
                </StyledText>
                {robot.status !== UNREACHABLE && local != null ? (
                  <Icon
                    // local boolean corresponds to a wired usb connection
                    name={local ? 'usb' : 'wifi'}
                    size={SIZE_1}
                    marginRight={SPACING.spacing3}
                  />
                ) : null}
              </Flex>
            </Flex>
          </Flex>

          {robot.status === CONNECTABLE ? (
            <RunningProtocolBanner robotName={robotName} />
          ) : null}
        </Flex>
        {robot.status === CONNECTABLE ? (
          <Flex>
            <AttachedPipettes robotName={robotName} />
            <AttachedModules robotName={robotName} />
          </Flex>
        ) : null}
      </Box>
      <RobotOverflowMenu robot={robot} alignSelf={ALIGN_START} />
    </Flex>
  ) : null
}

function AttachedModules(props: { robotName: string }): JSX.Element | null {
  const { robotName } = props
  const { t } = useTranslation('devices_landing')
  const attachedModules = useAttachedModules()
  return attachedModules.length > 0 ? (
    <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING.spacing4}>
      <StyledText
        as="h6"
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        color={COLORS.darkGreyEnabled}
        marginBottom={SPACING.spacing1}
      >
        {t('modules')}
      </StyledText>
      <Flex>
        {attachedModules.map((module, i) => (
          <ModuleIcon
            key={`${module.moduleModel}_${i}_${robotName}`}
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
function AttachedPipettes(props: { robotName: string }): JSX.Element {
  const { robotName } = props
  const { t } = useTranslation('devices_landing')
  const attachedPipettes = useAttachedPipettes()
  return (
    <>
      <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING.spacing4}>
        <StyledText
          as="h6"
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          color={COLORS.darkGreyEnabled}
        >
          {t('left_mount')}
        </StyledText>
        <StyledText as="p" id={`RobotCard_${robotName}_leftMountPipette`}>
          {attachedPipettes?.left?.modelSpecs.displayName ?? t('empty')}
        </StyledText>
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} paddingRight={SPACING.spacing4}>
        <StyledText
          as="h6"
          textTransform={TEXT_TRANSFORM_UPPERCASE}
          color={COLORS.darkGreyEnabled}
        >
          {t('right_mount')}
        </StyledText>
        <StyledText as="p" id={`RobotCard_${robotName}_rightMountPipette`}>
          {attachedPipettes?.right?.modelSpecs.displayName ?? t('empty')}
        </StyledText>
      </Flex>
    </>
  )
}

function RunningProtocolBanner(props: {
  robotName: string
}): JSX.Element | null {
  const { robotName } = props
  const { t } = useTranslation('devices_landing')
  const currentRunId = useCurrentRunId()
  const currentRunStatus = useCurrentRunStatus()
  const { displayName } = useProtocolDetailsForRun(currentRunId)

  return currentRunId != null &&
    currentRunStatus != null &&
    displayName != null ? (
    <Flex alignItems={ALIGN_CENTER} onClick={e => e.stopPropagation()}>
      <StyledText as="label" paddingRight={SPACING.spacing3}>
        {`${displayName}; ${t(`run_details:status_${currentRunStatus}`)}`}
      </StyledText>
      <Link
        to={`/devices/${robotName}/protocol-runs/${currentRunId}/run-log`}
        id={`RobotStatusBanner_${robotName}_goToRun`}
      >
        <TertiaryButton>{t('go_to_run')}</TertiaryButton>
      </Link>
    </Flex>
  ) : null
}
