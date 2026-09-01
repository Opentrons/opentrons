import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import isEmpty from 'lodash/isEmpty'

import { RUN_STATUS_IDLE } from '@opentrons/api-client'
import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_AROUND,
  OVERFLOW_SCROLL,
  SPACING,
} from '@opentrons/components'

import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { useToastOnErrorImage } from '/app/local-resources/images/hooks/useToastOnErrorImage'
import { RoundTab } from '/app/molecules/RoundTab'
import { useSyncRobotClock } from '/app/organisms/Desktop/Devices/hooks'
import { BackToTopButton } from '/app/organisms/Desktop/Devices/ProtocolRun/BackToTopButton'
import { ProtocolRunCamera } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera'
import { ProtocolRunHeader } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunHeader'
import { ProtocolRunModuleControls } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunModuleControls'
import { ProtocolRunRuntimeParameters } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunRunTimeParameters'
import { ProtocolRunSetup } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunSetup'
import { RunPreview } from '/app/organisms/Desktop/Devices/RunPreview'
import { RobotCertRotator } from '/app/organisms/Desktop/RobotCertImport/RobotCertRotator'
import { useCurrentRunStatus } from '/app/organisms/RunTimeControl'
import { useRobot, useRobotType } from '/app/redux-resources/robots'
import { fetchProtocols } from '/app/redux/protocol-storage'
import {
  useCurrentRunId,
  useModuleRenderInfoForProtocolById,
  useMostRecentCompletedAnalysis,
  useNotifyRunQuery,
  useQuickProtocolDetailsForRun,
  useRunStatuses,
} from '/app/resources/runs'

import type { ReactNode } from 'react'
import type { ViewportListRef } from 'react-viewport-list'
import type { DesktopRouteParams, ProtocolRunDetailsTab } from '/app/App/types'
import type { Dispatch } from '/app/redux/types'

const JUMP_OFFSET_FROM_TOP_PX = 20

export function ProtocolRunDetails(): JSX.Element | null {
  const { robotName, runId, protocolRunDetailsTab } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const dispatch = useDispatch<Dispatch>()

  const robot = useRobot(robotName)
  useSyncRobotClock(robotName)
  useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])
  return robot != null ? (
    <ApiHostProvider key={robot.name} robotName={robotName}>
      <RobotCertRotator>
        <Box
          minWidth="32rem"
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
      </RobotCertRotator>
    </ApiHostProvider>
  ) : null
}

const JUMPED_STEP_HIGHLIGHT_DELAY_MS = 1000
interface PageContentsProps {
  runId: string
  robotName: string
  protocolRunDetailsTab: ProtocolRunDetailsTab
}
function PageContents(props: PageContentsProps): ReactNode {
  const { runId, robotName, protocolRunDetailsTab } = props
  const robotType = useRobotType(robotName)
  const run = useNotifyRunQuery(runId)
  const runRecordCameraSettings = run?.data?.data.cameraSettings ?? null
  const runTimestamp = run.data?.data.createdAt ?? ''
  const runStatus = run?.data?.data.status ?? null
  const { displayName: protocolName } = useQuickProtocolDetailsForRun(runId)
  const protocolRunHeaderRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<ViewportListRef | null>(null)
  const [jumpedIndex, setJumpedIndex] = useState<number | null>(null)

  useToastOnErrorImage(runId)

  useEffect(() => {
    if (jumpedIndex != null) {
      setTimeout(() => {
        setJumpedIndex(null)
      }, JUMPED_STEP_HIGHLIGHT_DELAY_MS)
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
    [K in ProtocolRunDetailsTab]: {
      content: JSX.Element | null
      backToTop: JSX.Element | null
    }
  } = {
    setup: {
      content: (
        <ProtocolRunSetup
          protocolRunHeaderRef={protocolRunHeaderRef}
          robotName={robotName}
          runId={runId}
        />
      ),
      backToTop: (
        <Flex
          width="100%"
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_AROUND}
          marginTop={SPACING.spacing16}
        >
          <BackToTopButton
            protocolRunHeaderRef={protocolRunHeaderRef}
            robotName={robotName}
            runId={runId}
            sourceLocation=""
          />
        </Flex>
      ),
    },
    'runtime-parameters': {
      content: <ProtocolRunRuntimeParameters runId={runId} />,
      backToTop: null,
    },
    'module-controls': {
      content: (
        <ProtocolRunModuleControls robotName={robotName} runId={runId} />
      ),
      backToTop: null,
    },
    'run-preview': {
      content: (
        <RunPreview
          runId={runId}
          robotType={robotType}
          ref={listRef}
          jumpedIndex={jumpedIndex}
          makeHandleScrollToStep={makeHandleScrollToStep}
        />
      ),
      backToTop: null,
    },
    camera: {
      content: (
        <ProtocolRunCamera
          runStatus={runStatus}
          runRecordCameraSettings={runRecordCameraSettings}
          runId={runId}
          robotType={robotType}
          robotName={robotName}
          runTimestamp={runTimestamp}
          protocolName={protocolName ?? ''}
        />
      ),
      backToTop: null,
    },
  }
  const tabDetails = protocolRunDetailsContentByTab[protocolRunDetailsTab] ?? {
    // default to the setup tab if no tab or nonexistent tab is passed as a param
    content: (
      <Navigate to={`/devices/${robotName}/protocol-runs/${runId}/setup`} />
    ),
    backToTop: null,
  }
  const { content, backToTop } = tabDetails

  return (
    <>
      <ProtocolRunHeader
        protocolRunHeaderRef={protocolRunHeaderRef}
        robotName={robotName}
        runId={runId}
        makeHandleJumpToStep={makeHandleJumpToStep}
      />
      <Flex gridGap={SPACING.spacing8} marginBottom={SPACING.spacing12}>
        <SetupTab
          robotName={robotName}
          runId={runId}
          protocolRunDetailsTab={protocolRunDetailsTab}
        />
        <ParametersTab
          robotName={robotName}
          runId={runId}
          protocolRunDetailsTab={protocolRunDetailsTab}
        />
        <ModuleControlsTab
          robotName={robotName}
          runId={runId}
          protocolRunDetailsTab={protocolRunDetailsTab}
        />
        <RunPreviewTab robotName={robotName} runId={runId} />
        <CameraTab robotName={robotName} runId={runId} />
      </Flex>
      <Box
        backgroundColor={COLORS.white}
        // remove left upper corner border radius when first tab is active
        borderRadius={BORDERS.borderRadius8}
      >
        {content}
      </Box>
      {backToTop}
    </>
  )
}

interface SetupTabProps {
  robotName: string
  runId: string
  protocolRunDetailsTab?: ProtocolRunDetailsTab
}

const RUN_STATUS_POLL_MS = 5000

const SetupTab = (props: SetupTabProps): JSX.Element | null => {
  const { robotName, runId, protocolRunDetailsTab } = props
  const { t } = useTranslation('run_details')
  const currentRunId = useCurrentRunId()
  const currentRunStatus = useCurrentRunStatus({
    refetchInterval: RUN_STATUS_POLL_MS,
  })
  const navigate = useNavigate()
  const disabled = currentRunId !== runId
  const tabDisabledReason = `${t('setup')} ${t(
    'not_available_for_a_completed_run'
  )}`

  useEffect(
    () => {
      // On the initial render or when a run first begins, navigate to "run preview" if the run has started.
      if (
        currentRunStatus !== RUN_STATUS_IDLE &&
        protocolRunDetailsTab !== 'run-preview' &&
        protocolRunDetailsTab !== 'camera'
      ) {
        navigate(`/devices/${robotName}/protocol-runs/${runId}/run-preview`)
      }
      // On initial render or on a clone run, navigate to "run setup" if the run hasn't started.
      else if (
        currentRunStatus === RUN_STATUS_IDLE &&
        protocolRunDetailsTab !== 'setup'
      ) {
        navigate(`/devices/${robotName}/protocol-runs/${runId}/setup`)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentRunStatus]
  )

  return (
    <RoundTab
      disabled={disabled}
      tabDisabledReason={tabDisabledReason}
      to={`/devices/${robotName}/protocol-runs/${runId}/setup`}
      tabName={t('setup')}
    />
  )
}

interface ParametersTabProps {
  robotName: string
  runId: string
  protocolRunDetailsTab: ProtocolRunDetailsTab
}

const ParametersTab = (props: ParametersTabProps): ReactNode => {
  const { robotName, runId, protocolRunDetailsTab } = props
  const { t } = useTranslation('run_details')
  const mostRecentAnalysis = useMostRecentCompletedAnalysis(runId)
  const navigate = useNavigate()
  const disabled = mostRecentAnalysis == null

  useEffect(() => {
    if (disabled && protocolRunDetailsTab === 'runtime-parameters') {
      navigate(`/devices/${robotName}/protocol-runs/${runId}/run-preview`, {
        replace: true,
      })
    }
  }, [disabled, navigate, protocolRunDetailsTab, robotName, runId])

  return (
    <RoundTab
      disabled={disabled}
      to={`/devices/${robotName}/protocol-runs/${runId}/runtime-parameters`}
      tabName={t('parameters')}
    />
  )
}

interface ModuleControlsTabProps {
  robotName: string
  runId: string
  protocolRunDetailsTab: ProtocolRunDetailsTab
}

const ModuleControlsTab = (
  props: ModuleControlsTabProps
): JSX.Element | null => {
  const { robotName, runId, protocolRunDetailsTab } = props
  const { t } = useTranslation('run_details')
  const currentRunId = useCurrentRunId()
  const moduleRenderInfoForProtocolById =
    useModuleRenderInfoForProtocolById(runId)
  const { isRunStill } = useRunStatuses()
  const navigate = useNavigate()

  const disabled = currentRunId !== runId || !isRunStill
  const tabDisabledReason = `${t('module_controls')} ${t(
    currentRunId !== runId
      ? 'not_available_for_a_completed_run'
      : 'not_available_for_a_run_in_progress'
  )}`

  useEffect(() => {
    if (disabled && protocolRunDetailsTab === 'module-controls') {
      navigate(`/devices/${robotName}/protocol-runs/${runId}/run-preview`)
    }
  }, [disabled, navigate, protocolRunDetailsTab, robotName, runId])

  return isEmpty(moduleRenderInfoForProtocolById) ? null : (
    <RoundTab
      disabled={disabled}
      tabDisabledReason={tabDisabledReason}
      to={`/devices/${robotName}/protocol-runs/${runId}/module-controls`}
      tabName={t('module_controls')}
    />
  )
}

const RunPreviewTab = (props: SetupTabProps): ReactNode => {
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

const CameraTab = (props: SetupTabProps): JSX.Element | null => {
  const { robotName, runId } = props
  const { t } = useTranslation('run_details')

  return (
    <RoundTab
      disabled={false}
      to={`/devices/${robotName}/protocol-runs/${runId}/camera`}
      tabName={t('camera')}
    />
  )
}
