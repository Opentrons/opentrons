import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { css } from 'styled-components'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'
import { useModulesQuery } from '@opentrons/react-api-client'

import { useRunStatus } from '../../../RunTimeControl/hooks'
import { useIsRobotViewable, useProtocolDetailsForRun } from '../../hooks'
import { RunProgressMeter } from '../../../RunProgressMeter'
import { useNotifyRunQuery } from '../../../../resources/runs'
import { RunHeaderProtocolName } from './RunHeaderProtocolName'
import {
  RunHeaderModalContainer,
  useRunHeaderModalContainer,
} from './RunHeaderModalContainer'
import { RunHeaderBannerContainer } from './RunHeaderBannerContainer'
import { useRunAnalytics, useRunErrors, useRunHeaderRunControls } from './hooks'
import { RunHeaderContent } from './RunHeaderContent'
import { EQUIPMENT_POLL_MS, START_RUN_STATUSES } from './constants'

export interface ProtocolRunHeaderProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
  makeHandleJumpToStep: (index: number) => () => void
  missingSetupSteps: string[]
}

export function ProtocolRunHeader(
  props: ProtocolRunHeaderProps
): JSX.Element | null {
  const { protocolRunHeaderRef, robotName, runId } = props

  const navigate = useNavigate()

  const { data: runRecord } = useNotifyRunQuery(runId, { staleTime: Infinity })
  const { protocolData } = useProtocolDetailsForRun(runId)
  const isRobotViewable = useIsRobotViewable(robotName)
  const runStatus = useRunStatus(runId)
  const attachedModules =
    useModulesQuery({
      refetchInterval: EQUIPMENT_POLL_MS,
      enabled: START_RUN_STATUSES.includes(runStatus),
    })?.data?.data ?? []
  const runErrors = useRunErrors({
    runRecord: runRecord ?? null,
    runStatus,
    runId,
  })

  const enteredER = runRecord?.data.hasEverEnteredErrorRecovery ?? false
  const isResetRunLoadingRef = React.useRef(false)
  const protocolRunControls = useRunHeaderRunControls(runId, robotName)
  const runHeaderModalContainerUtils = useRunHeaderModalContainer({
    ...props,
    attachedModules,
    runStatus,
    protocolRunControls,
    runRecord: runRecord ?? null,
    runErrors,
  })

  React.useEffect(() => {
    if (protocolData != null && !isRobotViewable) {
      navigate('/devices')
    }
  }, [protocolData, isRobotViewable, navigate])

  useRunAnalytics({ runId, robotName, enteredER })

  return (
    <>
      <RunHeaderModalContainer
        runStatus={runStatus}
        runHeaderModalContainerUtils={runHeaderModalContainerUtils}
        runErrors={runErrors}
        protocolRunControls={protocolRunControls}
        {...props}
      />
      <Flex ref={protocolRunHeaderRef} css={CONTAINER_STYLE}>
        <RunHeaderProtocolName runId={runId} />
        <RunHeaderBannerContainer
          runStatus={runStatus}
          enteredER={enteredER}
          isResetRunLoading={isResetRunLoadingRef.current}
          runErrors={runErrors}
          runHeaderModalContainerUtils={runHeaderModalContainerUtils}
          {...props}
        />
        <RunHeaderContent
          runStatus={runStatus}
          isResetRunLoadingRef={isResetRunLoadingRef}
          attachedModules={attachedModules}
          protocolRunControls={protocolRunControls}
          runHeaderModalContainerUtils={runHeaderModalContainerUtils}
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
