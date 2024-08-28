import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { useRouteUpdateActions } from './useRouteUpdateActions'
import { useRecoveryCommands } from './useRecoveryCommands'
import { useRecoveryTipStatus } from './useRecoveryTipStatus'
import { useRecoveryRouting } from './useRecoveryRouting'
import { useFailedLabwareUtils } from './useFailedLabwareUtils'
import { getFailedCommandPipetteInfo, getNextSteps } from '../utils'
import { useDeckMapUtils } from './useDeckMapUtils'
import {
  useNotifyAllCommandsQuery,
  useNotifyRunQuery,
} from '../../../resources/runs'
import { useRecoveryOptionCopy } from './useRecoveryOptionCopy'
import { useRecoveryActionMutation } from './useRecoveryActionMutation'
import { useRunningStepCounts } from '../../../resources/protocols/hooks'
import { useRecoveryToasts } from './useRecoveryToasts'
import { useRecoveryAnalytics } from './useRecoveryAnalytics'

import type { PipetteData } from '@opentrons/api-client'
import type { RobotType } from '@opentrons/shared-data'
import type { IRecoveryMap } from '../types'
import type { ErrorRecoveryFlowsProps } from '..'
import type { UseRouteUpdateActionsResult } from './useRouteUpdateActions'
import type { UseRecoveryCommandsResult } from './useRecoveryCommands'
import type { RecoveryTipStatusUtils } from './useRecoveryTipStatus'
import type { UseFailedLabwareUtilsResult } from './useFailedLabwareUtils'
import type { UseDeckMapUtilsResult } from './useDeckMapUtils'
import type {
  CurrentRecoveryOptionUtils,
  SubMapUtils,
} from './useRecoveryRouting'
import type { RecoveryActionMutationResult } from './useRecoveryActionMutation'
import type { StepCounts } from '../../../resources/protocols/hooks'
import type { UseRecoveryAnalyticsResult } from './useRecoveryAnalytics'
import type { UseRecoveryTakeoverResult } from './useRecoveryTakeover'
import type { useRetainedFailedCommandBySource } from './useRetainedFailedCommandBySource'

export type ERUtilsProps = Omit<ErrorRecoveryFlowsProps, 'failedCommand'> & {
  toggleERWizAsActiveUser: UseRecoveryTakeoverResult['toggleERWizAsActiveUser']
  hasLaunchedRecovery: boolean
  isOnDevice: boolean
  robotType: RobotType
  failedCommand: ReturnType<typeof useRetainedFailedCommandBySource>
}

export interface ERUtilsResults {
  recoveryMap: IRecoveryMap
  currentRecoveryOptionUtils: CurrentRecoveryOptionUtils
  routeUpdateActions: UseRouteUpdateActionsResult
  recoveryCommands: UseRecoveryCommandsResult
  tipStatusUtils: RecoveryTipStatusUtils
  failedLabwareUtils: UseFailedLabwareUtilsResult
  deckMapUtils: UseDeckMapUtilsResult
  getRecoveryOptionCopy: ReturnType<typeof useRecoveryOptionCopy>
  recoveryActionMutationUtils: RecoveryActionMutationResult
  failedPipetteInfo: PipetteData | null
  hasLaunchedRecovery: boolean
  stepCounts: StepCounts
  commandsAfterFailedCommand: ReturnType<typeof getNextSteps>
  subMapUtils: SubMapUtils
  analytics: UseRecoveryAnalyticsResult
}

const SUBSEQUENT_COMMAND_DEPTH = 2
// Builds various Error Recovery utilities.
export function useERUtils({
  failedCommand,
  runId,
  toggleERWizAsActiveUser,
  hasLaunchedRecovery,
  protocolAnalysis,
  isOnDevice,
  robotType,
}: ERUtilsProps): ERUtilsResults {
  const { data: attachedInstruments } = useInstrumentsQuery()
  const { data: runRecord } = useNotifyRunQuery(runId)
  // TODO(jh, 06-04-24): Refactor the utilities that derive info
  // from runCommands once the server yields that info directly on an existing/new endpoint. We'll still need this with a
  // pageLength of 1 though for stepCount things.
  // Note that pageLength: 999 is ok only because we fetch this on mount. We use 999 because it should hopefully
  // provide the commands necessary for ER without taxing the server too heavily. This is NOT intended for produciton!
  const { data: runCommands } = useNotifyAllCommandsQuery(runId, {
    cursor: 0,
    pageLength: 999,
  })
  const failedCommandByRunRecord = failedCommand?.byRunRecord ?? null

  const stepCounts = useRunningStepCounts(runId, runCommands)

  const analytics = useRecoveryAnalytics()

  const {
    recoveryMap,
    setRM,
    currentRecoveryOptionUtils,
    ...subMapUtils
  } = useRecoveryRouting()

  const recoveryToastUtils = useRecoveryToasts({
    currentStepCount: stepCounts.currentStepNumber,
    selectedRecoveryOption: currentRecoveryOptionUtils.selectedRecoveryOption,
    isOnDevice,
    commandTextData: protocolAnalysis,
    robotType,
  })

  const failedPipetteInfo = getFailedCommandPipetteInfo({
    failedCommandByRunRecord,
    runRecord,
    attachedInstruments,
  })

  const tipStatusUtils = useRecoveryTipStatus({
    runId,
    runRecord,
    attachedInstruments,
    failedPipetteInfo,
  })

  const routeUpdateActions = useRouteUpdateActions({
    hasLaunchedRecovery,
    recoveryMap,
    toggleERWizAsActiveUser,
    setRecoveryMap: setRM,
  })

  const failedLabwareUtils = useFailedLabwareUtils({
    failedCommandByRunRecord,
    protocolAnalysis,
    failedPipetteInfo,
    runRecord,
    runCommands,
  })

  const recoveryCommands = useRecoveryCommands({
    runId,
    failedCommandByRunRecord,
    failedLabwareUtils,
    routeUpdateActions,
    recoveryToastUtils,
    analytics,
    selectedRecoveryOption: currentRecoveryOptionUtils.selectedRecoveryOption,
  })

  const deckMapUtils = useDeckMapUtils({
    runId,
    runRecord,
    protocolAnalysis,
    failedLabwareUtils,
  })

  const recoveryActionMutationUtils = useRecoveryActionMutation(runId)

  // TODO(jh, 06-14-24): Ensure other string build utilities that are internal to ErrorRecoveryFlows are exported under
  // one utility object in useERUtils.
  const getRecoveryOptionCopy = useRecoveryOptionCopy()
  const commandsAfterFailedCommand = getNextSteps(
    failedCommand,
    protocolAnalysis,
    SUBSEQUENT_COMMAND_DEPTH
  )
  return {
    recoveryMap,
    subMapUtils,
    currentRecoveryOptionUtils,
    recoveryActionMutationUtils,
    routeUpdateActions,
    recoveryCommands,
    hasLaunchedRecovery,
    tipStatusUtils,
    failedLabwareUtils,
    failedPipetteInfo,
    deckMapUtils,
    getRecoveryOptionCopy,
    stepCounts,
    commandsAfterFailedCommand,
    analytics,
  }
}
