import * as React from 'react'
import { isEmpty } from 'lodash'
import { useTranslation } from 'react-i18next'
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
  useRobot,
} from '../../../organisms/Devices/hooks'
import { ProtocolRunHeader } from '../../../organisms/Devices/ProtocolRun/ProtocolRunHeader'
import { RunLog } from '../../../organisms/Devices/ProtocolRun/RunLog'
import { ProtocolRunSetup } from '../../../organisms/Devices/ProtocolRun/ProtocolRunSetup'
import { ProtocolRunModuleControls } from '../../../organisms/Devices/ProtocolRun/ProtocolRunModuleControls'
import { useCurrentRunId } from '../../../organisms/ProtocolUpload/hooks'

import type { NavRouteParams, ProtocolRunDetailsTab } from '../../../App/types'

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

  &.active {
    background-color: ${COLORS.white};
    border-top: ${BORDERS.lineBorder};
    border-left: ${BORDERS.lineBorder};
    border-right: ${BORDERS.lineBorder};
    color: ${COLORS.blue};

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
  tabDisabledReason?: string
  to: string
  tabName: string
}

function RoundTab({
  tabDisabledReason,
  to,
  tabName,
}: RoundTabProps): JSX.Element {
  const [targetProps, tooltipProps] = useHoverTooltip()
  return tabDisabledReason != null ? (
    <>
      <StyledText
        color={COLORS.successDisabled}
        css={baseRoundTabStyling}
        {...targetProps}
      >
        {tabName}
      </StyledText>
      <Tooltip tooltipProps={tooltipProps}>{tabDisabledReason}</Tooltip>
    </>
  ) : (
    <RoundNavLink to={to} replace>
      {tabName}
    </RoundNavLink>
  )
}

export function ProtocolRunDetails(): JSX.Element | null {
  const { t } = useTranslation('run_details')
  const {
    robotName,
    runId,
    protocolRunDetailsTab,
  } = useParams<NavRouteParams>()

  const protocolRunHeaderRef = React.useRef<HTMLDivElement>(null)

  const robot = useRobot(robotName)

  interface ProtocolRunDetailsTabProps {
    protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
    robotName: string
    runId: string
  }

  const protocolRunDetailsContentByTab: {
    [K in ProtocolRunDetailsTab]: ({
      protocolRunHeaderRef,
      robotName,
      runId,
    }: ProtocolRunDetailsTabProps) => JSX.Element | null
  } = {
    setup: () => (
      <ProtocolRunSetup
        protocolRunHeaderRef={protocolRunHeaderRef}
        robotName={robotName}
        runId={runId}
      />
    ),
    'module-controls': () => (
      <ProtocolRunModuleControls robotName={robotName} runId={runId} />
    ),
    'run-log': () => <RunLog robotName={robotName} runId={runId} />,
  }

  const ProtocolRunDetailsContent =
    protocolRunDetailsContentByTab[protocolRunDetailsTab] ??
    // default to the setup tab if no tab or nonexistent tab is passed as a param
    (() => (
      <Redirect to={`/devices/${robotName}/protocol-runs/${runId}/setup`} />
    ))

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
            <RoundTab
              id="ProtocolRunDetails_runLogTab"
              to={`/devices/${robotName}/protocol-runs/${runId}/run-log`}
              tabName={t('run_log')}
            />
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
            <ProtocolRunDetailsContent
              protocolRunHeaderRef={protocolRunHeaderRef}
              robotName={robotName}
              runId={runId}
            />
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

  return (
    <>
      <RoundTab
        id="ProtocolRunDetails_setupTab"
        tabDisabledReason={
          currentRunId !== runId
            ? `${t('setup')} ${t('not_available_for_a_completed_run')}`
            : undefined
        }
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

  return isEmpty(moduleRenderInfoForProtocolById) ? null : (
    <>
      <RoundTab
        id="ProtocolRunDetails_moduleControlsTab"
        tabDisabledReason={
          currentRunId !== runId
            ? `${t('module_controls')} ${t(
                'not_available_for_a_completed_run'
              )}`
            : undefined
        }
        to={`/devices/${robotName}/protocol-runs/${runId}/module-controls`}
        tabName={t('module_controls')}
      />
      {currentRunId !== runId ? (
        // redirect to run log if not current run
        <Redirect to={`/devices/${robotName}/protocol-runs/${runId}/run-log`} />
      ) : null}
    </>
  )
}
