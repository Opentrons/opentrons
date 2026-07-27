import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { css } from 'styled-components'

import { RUN_STATUS_IDLE, RUN_STATUS_RUNNING } from '@opentrons/api-client'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'
import {
  useAccessControlEnabledQuery,
  useModulesQuery,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useInitializeCameraState } from '/app/local-resources/images/hooks/useInitializeCameraState'
import { isCancellableStatus } from '/app/local-resources/runs/utils'
import { SignRunModal } from '/app/organisms/Desktop/SignRunModal'
import { useIsRobotViewable } from '/app/redux-resources/robots'
import { useRunGeneratedDataFiles } from '/app/resources/dataFiles/useRunGeneratedDataFiles'
import {
  DEFAULT_STATUS_REFETCH_INTERVAL,
  useCloseCurrentRun,
  useNotifyRunQuery,
  useProtocolDetailsForRun,
} from '/app/resources/runs'

import { EQUIPMENT_POLL_MS } from '../../../../DoorOpenControl/constants'
import { RunProgressMeter } from '../../../RunProgressMeter'
import { useRunAnalytics, useRunErrors, useRunHeaderRunControls } from './hooks'
import { RunHeaderBannerContainer } from './RunHeaderBannerContainer'
import { RunHeaderContent } from './RunHeaderContent'
import {
  RunHeaderModalContainer,
  useRunHeaderModalContainer,
} from './RunHeaderModalContainer'
import { RunHeaderProtocolName } from './RunHeaderProtocolName'

import type { RefObject } from 'react'

export interface ProtocolRunHeaderProps {
  protocolRunHeaderRef: RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
  makeHandleJumpToStep: (index: number) => () => void
}

export function ProtocolRunHeader(
  props: ProtocolRunHeaderProps
): JSX.Element | null {
  const { protocolRunHeaderRef, robotName, runId } = props

  const navigate = useNavigate()

  const { data: runRecord } = useNotifyRunQuery(runId, {
    staleTime: Infinity,
    refetchInterval: DEFAULT_STATUS_REFETCH_INTERVAL,
  })
  const { protocolData } = useProtocolDetailsForRun(runId)
  const isRobotViewable = useIsRobotViewable(robotName)
  const runStatus = runRecord?.data.status ?? null

  const attachedModules =
    useModulesQuery({
      refetchInterval: EQUIPMENT_POLL_MS,
      enabled: isCancellableStatus(runStatus),
    })?.data?.data ?? []
  const runErrors = useRunErrors({
    runRecord: runRecord ?? null,
    runStatus: runStatus,
    runId,
  })

  const documentationState = useDocumentationState()
  const { closeCurrentRun, isClosingCurrentRun } =
    useCloseCurrentRun(documentationState)
  const { data: accessControlSettings, isLoading: isAccessControlLoading } =
    useAccessControlEnabledQuery()
  const isSigningRequired =
    accessControlSettings?.data.accessControlEnabled ?? false
  // TODO(jj, 2026-07-27): Remove hasLocallySigned once the sign endpoint sets
  // run.signedBy and the modal dismisses from that server state.
  const [hasLocallySigned, setHasLocallySigned] = useState(false)
  useEffect(() => {
    setHasLocallySigned(false)
  }, [runId])
  const hasSignedBy =
    (runRecord?.data.signedBy != null && runRecord.data.signedBy !== '') ||
    hasLocallySigned
  const isSigned = !isSigningRequired || hasSignedBy
  // Set when close is requested before signing; cleared after a successful sign.
  const [isSignRunPending, setIsSignRunPending] = useState(false)
  const showSignRunModal =
    isSignRunPending &&
    !isAccessControlLoading &&
    isSigningRequired &&
    !hasSignedBy

  // Keep the run current until the user signs when access control requires it.
  // Showing SignRun only after a close attempt also avoids covering drop-tip flows.
  const closeCurrentRunIfSigned = useCallback(() => {
    if (isAccessControlLoading || !isSigned) {
      setIsSignRunPending(true)
      return
    }
    setIsSignRunPending(false)
    closeCurrentRun()
  }, [closeCurrentRun, isAccessControlLoading, isSigned])

  useEffect(() => {
    if (isSigned && isSignRunPending && !isAccessControlLoading) {
      setIsSignRunPending(false)
      closeCurrentRun()
    }
  }, [isSigned, isSignRunPending, isAccessControlLoading, closeCurrentRun])

  const enteredER = runRecord?.data.hasEverEnteredErrorRecovery ?? false
  const protocolRunControls = useRunHeaderRunControls(runId, robotName)
  const runHeaderModalContainerUtils = useRunHeaderModalContainer({
    ...props,
    attachedModules,
    runStatus,
    protocolRunControls,
    runRecord: runRecord ?? null,
    runErrors,
    closeCurrentRun: closeCurrentRunIfSigned,
  })

  useEffect(() => {
    if (protocolData != null && !isRobotViewable) {
      navigate('/devices')
    }
  }, [protocolData, isRobotViewable, navigate])

  // To persist "run again" loading conditions into a new run, we need a scalar that persists longer than
  // the runControl isResetRunLoading, which completes before we want to change user-facing copy/CTAs.
  const isResetRunLoadingRef = useRef(false)
  if (runStatus === RUN_STATUS_IDLE || runStatus === RUN_STATUS_RUNNING) {
    isResetRunLoadingRef.current = false
  }

  useInitializeCameraState(runId)
  useRunAnalytics({ runId, robotName, enteredER })
  const outputFileIds = useRunGeneratedDataFiles(runId)

  return (
    <>
      <RunHeaderModalContainer
        runStatus={runStatus}
        runHeaderModalContainerUtils={runHeaderModalContainerUtils}
        runErrors={runErrors}
        protocolRunControls={protocolRunControls}
        {...props}
      />
      {showSignRunModal ? (
        <SignRunModal
          runId={runId}
          robotName={robotName}
          onSigned={() => {
            setHasLocallySigned(true)
          }}
        />
      ) : null}
      <Flex ref={protocolRunHeaderRef} css={CONTAINER_STYLE}>
        <RunHeaderProtocolName runId={runId} />
        <RunHeaderBannerContainer
          runStatus={runStatus}
          enteredER={enteredER}
          isResetRunLoading={isResetRunLoadingRef.current}
          runErrors={runErrors}
          runHeaderModalContainerUtils={runHeaderModalContainerUtils}
          hasImages={outputFileIds.jpeg.length > 0}
          hasCsvFiles={outputFileIds.csv.length > 0}
          closeCurrentRun={closeCurrentRunIfSigned}
          isClosingCurrentRun={isClosingCurrentRun}
          {...props}
        />
        <RunHeaderContent
          runRecord={runRecord ?? null}
          runStatus={runStatus}
          isResetRunLoadingRef={isResetRunLoadingRef}
          attachedModules={attachedModules}
          protocolRunControls={protocolRunControls}
          runHeaderModalContainerUtils={runHeaderModalContainerUtils}
          isClosingCurrentRun={isClosingCurrentRun}
          numberOfAtomicCommands={
            protocolData?.status === 'completed'
              ? protocolData.commands.length
              : 0
          }
          {...props}
        />
        <RunProgressMeter {...props} />
      </Flex>
    </>
  )
}

const CONTAINER_STYLE = css`
  background-color: ${COLORS.white};
  border-radius: ${BORDERS.borderRadius8};
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};
  margin-bottom: ${SPACING.spacing16};
  padding: ${SPACING.spacing16};
`
