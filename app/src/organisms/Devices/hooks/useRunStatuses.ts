import {
  RUN_STATUS_FAILED,
  RUN_STATUS_IDLE,
  RUN_STATUS_STOPPED,
  RUN_STATUS_SUCCEEDED,
} from '@opentrons/api-client'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import { useRunStatus } from '../../RunTimeControl/hooks'

interface RunStatusesInfo {
  isRunStill: boolean
  isRunTerminal: boolean
  isRunIdle: boolean
}

export function useRunStatuses(): RunStatusesInfo {
  const currentRunId = useCurrentRunId()
  const runStatus = useRunStatus(currentRunId)
  const isRunIdle = runStatus === RUN_STATUS_IDLE
  const isRunTerminal =
    runStatus === RUN_STATUS_SUCCEEDED ||
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_FAILED

  const isRunStill =
    runStatus === RUN_STATUS_SUCCEEDED ||
    runStatus === RUN_STATUS_STOPPED ||
    runStatus === RUN_STATUS_FAILED ||
    runStatus === RUN_STATUS_IDLE

  return { isRunStill, isRunTerminal, isRunIdle }
}
