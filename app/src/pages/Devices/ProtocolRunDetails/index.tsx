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
  useRunStatuses,
  useSyncRobotClock,
} from '../../../organisms/Devices/hooks'
import { ProtocolRunHeader } from '../../../organisms/Devices/ProtocolRun/ProtocolRunHeader'
import { RunPreview } from '../../../organisms/RunPreview'
import { ProtocolRunSetup } from '../../../organisms/Devices/ProtocolRun/ProtocolRunSetup'
import { ProtocolRunModuleControls } from '../../../organisms/Devices/ProtocolRun/ProtocolRunModuleControls'
import { useCurrentRunId } from '../../../organisms/ProtocolUpload/hooks'
import { OPENTRONS_USB } from '../../../redux/discovery'
import { fetchProtocols } from '../../../redux/protocol-storage'
import { appShellRequestor } from '../../../redux/shell/remote'

import type {
  DesktopRouteParams,
  ProtocolRunDetailsTab,
} from '../../../App/types'
import type { Dispatch } from '../../../redux/types'
import { useMostRecentCompletedAnalysis } from '../../../organisms/LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { ViewportListRef } from 'react-viewport-list'

const baseRoundTabStyling = css`
  ${TYPOGRAPHY.pSemiBold}
  border-radius: ${BORDERS.radiusSoftCorners} ${BORDERS.radiusSoftCorners} 0 0;
  border-top: ${BORDERS.transparentLineBorder};
  border-left: ${BORDERS.transparentLineBorder};
  border-right: ${BORDERS.transparentLineBorder};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
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
    color: ${COLORS.blueEnabled};

    &:hover {
      color: ${COLORS.blueHover};
    }

    /* extend below the tab when active to flow into the content */
    &:after {
      position: ${POSITION_ABSOLUTE};
      display: ${DISPLAY_BLOCK};
      content: '';
      background-color: ${COLORS.white};
      bottom: -1px;
      left: 0;
      height: 1px;
      width: 100%;
    }
  }
`
const JUMP_OFFSET_FROM_TOP_PX = 20

interface RoundTabProps {
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
  } = useParams<DesktopRouteParams>()
  const dispatch = useDispatch<Dispatch>()

  const robot = useRobot(robotName)
  useSyncRobotClock(robotName)
  React.useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])

  return robot != null ? (
    <ApiHostProvider
      key={robot.name}
      hostname={robot.ip ?? null}
      requestor={robot?.ip === OPENTRONS_USB ? appShellRequestor : undefined}
      robotName={robot.name}
    >
      <Box
        minWidth={SIZE_6}
        height="100%"
        overflow={OVERFLOW_SCROLL}
        padding={SPACING.spacing16}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          marginBottom={SPACING.spacing16}
          width="100%"
        >
          <PageContents
            runId={runId}
            robotName={robotName}
            protocolRunDetailsTab={protocolRunDetailsTab}
          />
        </Flex>
      </Box>
    </ApiHostProvider>
  ) : null
}

const JUMPED_STEP_HIGHLIGHT_DELAY_MS = 1000
interface PageContentsProps {
  runId: string
  robotName: string
  protocolRunDetailsTab: ProtocolRunDetailsTab
}
function PageContents(props: PageContentsProps): JSX.Element {
  const { runId, robotName, protocolRunDetailsTab } = props
  const protocolRunHeaderRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<ViewportListRef | null>(null)
  const [jumpedIndex, setJumpedIndex] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (jumpedIndex != null) {
      setTimeout(() => setJumpedIndex(null), JUMPED_STEP_HIGHLIGHT_DELAY_MS)
    }
  }, [jumpedIndex])

  const makeHandleScrollToStep = (i: number) => () => {
    listRef.current?.scrollToIndex(i, true, -1 * JUMP_OFFSET_FROM_TOP_PX)
  }
  const makeHandleJumpToStep = (i: number) => () => {
    makeHandleScrollToStep(i)()
    setJumpedIndex(i)
  }
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
    'run-preview': (
      <RunPreview
        runId={runId}
        ref={listRef}
        jumpedIndex={jumpedIndex}
        makeHandleScrollToStep={makeHandleScrollToStep}
      />
    ),
  }

  const protocolRunDetailsContent = protocolRunDetailsContentByTab[
    protocolRunDetailsTab
  ] ?? (
    // default to the setup tab if no tab or nonexistent tab is passed as a param
    <Redirect to={`/devices/${robotName}/protocol-runs/${runId}/setup`} />
  )

  return (
    <>
      <ProtocolRunHeader
        protocolRunHeaderRef={protocolRunHeaderRef}
        robotName={robotName}
        runId={runId}
        makeHandleJumpToStep={makeHandleJumpToStep}
      />
      <Flex>
        <SetupTab robotName={robotName} runId={runId} />
        <ModuleControlsTab robotName={robotName} runId={runId} />
        <RunPreviewTab robotName={robotName} runId={runId} />
      </Flex>
      <Box
        backgroundColor={COLORS.white}
        border={`1px ${BORDERS.styleSolid} ${COLORS.medGreyEnabled}`}
        // remove left upper corner border radius when first tab is active
        borderRadius={`${
          protocolRunDetailsTab === 'setup'
            ? '0'
            : String(BORDERS.radiusSoftCorners)
        } ${String(BORDERS.radiusSoftCorners)} ${String(
          BORDERS.radiusSoftCorners
        )} ${String(BORDERS.radiusSoftCorners)}`}
      >
        {protocolRunDetailsContent}
      </Box>
    </>
  )
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
        disabled={disabled}
        tabDisabledReason={tabDisabledReason}
        to={`/devices/${robotName}/protocol-runs/${runId}/setup`}
        tabName={t('setup')}
      />
      {currentRunId !== runId ? (
        // redirect to run preview if not current run
        <Redirect
          to={`/devices/${robotName}/protocol-runs/${runId}/run-preview`}
        />
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
        disabled={disabled}
        tabDisabledReason={tabDisabledReason}
        to={`/devices/${robotName}/protocol-runs/${runId}/module-controls`}
        tabName={t('module_controls')}
      />
      {disabled ? (
        // redirect to run preview if not current run
        <Redirect
          to={`/devices/${robotName}/protocol-runs/${runId}/run-preview`}
        />
      ) : null}
    </>
  )
}

const RunPreviewTab = (props: SetupTabProps): JSX.Element | null => {
  const { robotName, runId } = props
  const { t } = useTranslation('run_details')

  const robotSideAnalysis = useMostRecentCompletedAnalysis(runId)

  return (
    <RoundTab
      disabled={robotSideAnalysis == null}
      to={`/devices/${robotName}/protocol-runs/${runId}/run-preview`}
      tabName={t('run_preview')}
    />
  )
}
