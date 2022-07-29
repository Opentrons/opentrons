import * as React from 'react'
import isEmpty from 'lodash/isEmpty'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { NavLink, Redirect, useParams } from 'react-router-dom'
import styled, { css } from 'styled-components'

import {
  Box,
  Flex,
  useHoverTooltip,
  DIRECTION_COLUMN,
  DISPLAY_BLOCK,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  OVERFLOW_SCROLL,
  SIZE_1,
  SIZE_6,
  BORDERS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { ApiHostProvider } from '@opentrons/react-api-client'
import { StyledText } from '../../../atoms/text'
import { Tooltip } from '../../../atoms/Tooltip'
import {
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
  useRobot,
  useRunStatuses,
  useSyncRobotClock,
} from '../../../organisms/Devices/hooks'
import { ProtocolRunHeader } from '../../../organisms/Devices/ProtocolRun/ProtocolRunHeader'
import { RunLog } from '../../../organisms/Devices/ProtocolRun/RunLog'
import { ProtocolRunSetup } from '../../../organisms/Devices/ProtocolRun/ProtocolRunSetup'
import { ProtocolRunModuleControls } from '../../../organisms/Devices/ProtocolRun/ProtocolRunModuleControls'
import { useCurrentRunId } from '../../../organisms/ProtocolUpload/hooks'
import { fetchProtocols } from '../../../redux/protocol-storage'

import type { NavRouteParams, ProtocolRunDetailsTab } from '../../../App/types'
import type { Dispatch } from '../../../redux/types'

const baseRoundTabStyling = css`
  ${TYPOGRAPHY.pSemiBold}
  border-radius: ${BORDERS.radiusSoftCorners} ${BORDERS.radiusSoftCorners} 0 0;
  border-top: ${BORDERS.transparentLineBorder};
  border-left: ${BORDERS.transparentLineBorder};
  border-right: ${BORDERS.transparentLineBorder};
  padding: ${SPACING.spacing3} ${SPACING.spacing4};
  position: ${POSITION_RELATIVE};
`

const RoundNavLink = styled(NavLink)`
  ${baseRoundTabStyling}
  color: ${COLORS.darkGreyEnabled};

  &:hover {
    background-color: ${COLORS.fundamentalsBackgroundShade};
  }

  &.active {
    background-color: ${COLORS.white};
    border-top: ${BORDERS.lineBorder};
    border-left: ${BORDERS.lineBorder};
    border-right: ${BORDERS.lineBorder};
    color: ${COLORS.blue};

    &:hover {
      color: ${COLORS.blueHover};
    }

    /* extend below the tab when active to flow into the content */
    &:after {
      position: ${POSITION_ABSOLUTE};
      display: ${DISPLAY_BLOCK};
      content: '';
      background-color: ${COLORS.white};
      top: 100;
      left: 0;
      height: ${SIZE_1};
      width: 100%;
    }
  }
`

interface RoundTabProps {
  id: string
  disabled: boolean
  tabDisabledReason?: string
  to: string
  tabName: string
}

function RoundTab({
  disabled,
  tabDisabledReason,
  to,
  tabName,
}: RoundTabProps): JSX.Element {
  const [targetProps, tooltipProps] = useHoverTooltip()
  return disabled ? (
    <>
      <StyledText
        color={COLORS.successDisabled}
        css={baseRoundTabStyling}
        {...targetProps}
      >
        {tabName}
      </StyledText>
      {tabDisabledReason != null ? (
        <Tooltip tooltipProps={tooltipProps}>{tabDisabledReason}</Tooltip>
      ) : null}
    </>
  ) : (
    <RoundNavLink to={to} replace>
      {tabName}
    </RoundNavLink>
  )
}

export function ProtocolRunDetails(): JSX.Element | null {
  const {
    robotName,
    runId,
    protocolRunDetailsTab,
  } = useParams<NavRouteParams>()
  const dispatch = useDispatch<Dispatch>()

  const protocolRunHeaderRef = React.useRef<HTMLDivElement>(null)

  const robot = useRobot(robotName)
  useSyncRobotClock(robotName)

  const protocolRunDetailsContentByTab: {
    [K in ProtocolRunDetailsTab]: JSX.Element | null
  } = {
    setup: (
      <ProtocolRunSetup
        protocolRunHeaderRef={protocolRunHeaderRef}
        robotName={robotName}
        runId={runId}
      />
    ),
    'module-controls': (
      <ProtocolRunModuleControls robotName={robotName} runId={runId} />
    ),
    'run-log': <RunLog robotName={robotName} runId={runId} />,
  }

  const protocolRunDetailsContent = protocolRunDetailsContentByTab[
    protocolRunDetailsTab
  ] ?? (
    // default to the setup tab if no tab or nonexistent tab is passed as a param
    <Redirect to={`/devices/${robotName}/protocol-runs/${runId}/setup`} />
  )

  React.useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])

  return robot != null ? (
    <ApiHostProvider
      key={robot.name}
      hostname={robot.ip ?? null}
      robotName={robot.name}
    >
      <Box
        minWidth={SIZE_6}
        height="100%"
        overflow={OVERFLOW_SCROLL}
        padding={SPACING.spacing4}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          marginBottom={SPACING.spacing4}
          width="100%"
        >
          <ProtocolRunHeader
            protocolRunHeaderRef={protocolRunHeaderRef}
            robotName={robot.name}
            runId={runId}
          />
          <Flex>
            <SetupTab robotName={robotName} runId={runId} />
            <ModuleControlsTab robotName={robotName} runId={runId} />
            <RunLogTab robotName={robotName} runId={runId} />
          </Flex>
          <Box
            backgroundColor={COLORS.white}
            border={`${SPACING.spacingXXS} ${BORDERS.styleSolid} ${COLORS.medGrey}`}
            // remove left upper corner border radius when first tab is active
            borderRadius={`${
              protocolRunDetailsTab === 'setup'
                ? '0'
                : BORDERS.radiusSoftCorners
            } ${BORDERS.radiusSoftCorners} ${BORDERS.radiusSoftCorners} ${
              BORDERS.radiusSoftCorners
            }`}
          >
            {protocolRunDetailsContent}
          </Box>
        </Flex>
      </Box>
    </ApiHostProvider>
  ) : null
}

interface SetupTabProps {
  robotName: string
  runId: string
}

const SetupTab = (props: SetupTabProps): JSX.Element | null => {
  const { robotName, runId } = props
  const { t } = useTranslation('run_details')
  const currentRunId = useCurrentRunId()

  const disabled = currentRunId !== runId
  const tabDisabledReason = `${t('setup')} ${t(
    'not_available_for_a_completed_run'
  )}`

  return (
    <>
      <RoundTab
        id="ProtocolRunDetails_setupTab"
        disabled={disabled}
        tabDisabledReason={tabDisabledReason}
        to={`/devices/${robotName}/protocol-runs/${runId}/setup`}
        tabName={t('setup')}
      />
      {currentRunId !== runId ? (
        // redirect to run log if not current run
        <Redirect to={`/devices/${robotName}/protocol-runs/${runId}/run-log`} />
      ) : null}
    </>
  )
}

interface ModuleControlsTabProps {
  robotName: string
  runId: string
}

const ModuleControlsTab = (
  props: ModuleControlsTabProps
): JSX.Element | null => {
  const { robotName, runId } = props
  const { t } = useTranslation('run_details')
  const currentRunId = useCurrentRunId()
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const { isRunStill } = useRunStatuses()

  const disabled = currentRunId !== runId || !isRunStill
  const tabDisabledReason = `${t('module_controls')} ${t(
    currentRunId !== runId
      ? 'not_available_for_a_completed_run'
      : 'not_available_for_a_run_in_progress'
  )}`

  return isEmpty(moduleRenderInfoForProtocolById) ? null : (
    <>
      <RoundTab
        id="ProtocolRunDetails_moduleControlsTab"
        disabled={disabled}
        tabDisabledReason={tabDisabledReason}
        to={`/devices/${robotName}/protocol-runs/${runId}/module-controls`}
        tabName={t('module_controls')}
      />
      {disabled ? (
        // redirect to run log if not current run
        <Redirect to={`/devices/${robotName}/protocol-runs/${runId}/run-log`} />
      ) : null}
    </>
  )
}

const RunLogTab = (props: SetupTabProps): JSX.Element | null => {
  const { robotName, runId } = props
  const { t } = useTranslation('run_details')
  const { protocolData } = useProtocolDetailsForRun(runId)

  const disabled = protocolData == null

  return (
    <RoundTab
      id="ProtocolRunDetails_runLogTab"
      disabled={disabled}
      to={`/devices/${robotName}/protocol-runs/${runId}/run-log`}
      tabName={t('run_log')}
    />
  )
}
