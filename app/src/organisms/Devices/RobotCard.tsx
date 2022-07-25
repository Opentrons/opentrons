import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useHistory } from 'react-router-dom'
import { css } from 'styled-components'

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
  BORDERS,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import OT2_PNG from '../../assets/images/OT2-R_HERO.png'
import { StyledText } from '../../atoms/text'
import { SecondaryTertiaryButton } from '../../atoms/buttons'
import { CONNECTABLE, UNREACHABLE } from '../../redux/discovery'
import { ModuleIcon } from '../../molecules/ModuleIcon'
import { useCurrentRunId } from '../../organisms/ProtocolUpload/hooks'
import { useCurrentRunStatus } from '../../organisms/RunTimeControl/hooks'
import { UpdateRobotBanner } from '../UpdateRobotBanner'
import {
  useAttachedModules,
  useAttachedPipettes,
  useProtocolDetailsForRun,
} from './hooks'
import { ReachableBanner } from './ReachableBanner'
import { RobotOverflowMenu } from './RobotOverflowMenu'

import type { DiscoveredRobot } from '../../redux/discovery/types'

const ROBOT_CARD_STYLE = css`
  border: 1px solid ${COLORS.medGrey};
  &:hover {
    border: 1px solid ${COLORS.medGreyHover};
  }
`

const ROBOT_CARD_BREAKPOINT = '750px'

const ROBOT_CARD_ATTACHMENTS_GRID = css`
  display: grid;
  grid-template-columns: none;
  grid-template-rows: 2fr 1fr;

  @media (min-width: ${ROBOT_CARD_BREAKPOINT}) {
    grid-template-columns: 4fr 1fr;
    grid-template-rows: none;
  }
`

const ROBOT_CARD_PIPETTES_GRID = css`
  display: grid;
  grid-template-columns: none;
  grid-template-rows: 1fr;

  @media (min-width: ${ROBOT_CARD_BREAKPOINT}) {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: none;
  }
`

interface RobotCardProps {
  robot: DiscoveredRobot
}

export function RobotCard(props: RobotCardProps): JSX.Element | null {
  const { robot } = props
  const { name: robotName = null, local } = robot
  const history = useHistory()

  return robotName != null ? (
    <Flex
      alignItems={ALIGN_CENTER}
      backgroundColor={COLORS.white}
      css={ROBOT_CARD_STYLE}
      borderRadius={BORDERS.radiusSoftCorners}
      flexDirection={DIRECTION_ROW}
      marginBottom={SPACING.spacing3}
      padding={`${SPACING.spacing2} ${SPACING.spacing2} ${SPACING.spacing3} ${SPACING.spacing3}`}
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
        <UpdateRobotBanner robot={robot} marginBottom={SPACING.spacing3} />
        <ReachableBanner robot={robot} />
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_START}>
          <Flex flexDirection={DIRECTION_COLUMN}>
            <StyledText
              as="h6"
              paddingBottom={SPACING.spacing1}
              id={`RobotStatusBanner_${robotName}_robotModel`}
              color={COLORS.darkGreyEnabled}
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
          <Box css={ROBOT_CARD_ATTACHMENTS_GRID}>
            <AttachedPipettes robotName={robotName} />
            <AttachedModules robotName={robotName} />
          </Box>
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
    <Box
      display="grid"
      gridTemplateRows="1fr 1fr"
      paddingRight={SPACING.spacing4}
    >
      <StyledText
        as="h6"
        textTransform={TYPOGRAPHY.textTransformUppercase}
        color={COLORS.darkGreyEnabled}
        marginBottom={SPACING.spacing2}
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
    </Box>
  ) : (
    <Flex width="100%"></Flex>
  )
}
function AttachedPipettes(props: { robotName: string }): JSX.Element {
  const { robotName } = props
  const { t } = useTranslation('devices_landing')
  const attachedPipettes = useAttachedPipettes()

  return (
    <Box css={ROBOT_CARD_PIPETTES_GRID}>
      <Box gridTemplateRows="1fr 1fr" paddingRight={SPACING.spacing4}>
        <StyledText
          as="h6"
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.darkGreyEnabled}
          marginBottom={SPACING.spacing2}
        >
          {t('left_mount')}
        </StyledText>
        <StyledText as="p" id={`RobotCard_${robotName}_leftMountPipette`}>
          {attachedPipettes?.left?.modelSpecs.displayName ?? t('empty')}
        </StyledText>
      </Box>
      <Box gridTemplateRows="1fr 1fr" paddingRight={SPACING.spacing4}>
        <StyledText
          as="h6"
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.darkGreyEnabled}
          marginBottom={SPACING.spacing2}
        >
          {t('right_mount')}
        </StyledText>
        <StyledText as="p" id={`RobotCard_${robotName}_rightMountPipette`}>
          {attachedPipettes?.right?.modelSpecs.displayName ?? t('empty')}
        </StyledText>
      </Box>
    </Box>
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
        <SecondaryTertiaryButton>{t('go_to_run')}</SecondaryTertiaryButton>
      </Link>
    </Flex>
  ) : null
}
