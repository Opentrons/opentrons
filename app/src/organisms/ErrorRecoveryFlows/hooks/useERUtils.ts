import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { useRouteUpdateActions } from './useRouteUpdateActions'
import { useRecoveryCommands } from './useRecoveryCommands'
import { useRecoveryTipStatus } from './useRecoveryTipStatus'
import { useRecoveryRouting } from './useRecoveryRouting'
import { useFailedLabwareUtils } from './useFailedLabwareUtils'
import { getNextSteps } from '../utils'
import { useDeckMapUtils } from './useDeckMapUtils'
import {
  useNotifyAllCommandsQuery,
  useNotifyRunQuery,
} from '/app/resources/runs'
import { useRecoveryOptionCopy } from './useRecoveryOptionCopy'
import { useRecoveryActionMutation } from './useRecoveryActionMutation'
import { useRunningStepCounts } from '/app/resources/protocols/hooks'
import { useRecoveryToasts } from './useRecoveryToasts'
import { useRecoveryAnalytics } from '/app/redux-resources/analytics'
import { useShowDoorInfo } from './useShowDoorInfo'
import { useCleanupRecoveryState } from './useCleanupRecoveryState'
import { useFailedPipetteUtils } from './useFailedPipetteUtils'

import type {
  LabwareDefinition2,
  LabwareDefinitionsByUri,
  RobotType,
} from '@opentrons/shared-data'
import type { IRecoveryMap, RouteStep, RecoveryRoute } from '../types'
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
import type { StepCounts } from '/app/resources/protocols/hooks'
import type { UseRecoveryAnalyticsResult } from '/app/redux-resources/analytics'
import type { UseRecoveryTakeoverResult } from './useRecoveryTakeover'
import type { useRetainedFailedCommandBySource } from './useRetainedFailedCommandBySource'
import type { UseShowDoorInfoResult } from './useShowDoorInfo'
import type { UseFailedPipetteUtilsResult } from './useFailedPipetteUtils'

export type ERUtilsProps = Omit<ErrorRecoveryFlowsProps, 'failedCommand'> & {
  toggleERWizAsActiveUser: UseRecoveryTakeoverResult['toggleERWizAsActiveUser']
  hasLaunchedRecovery: boolean
  isOnDevice: boolean
  robotType: RobotType
  failedCommand: ReturnType<typeof useRetainedFailedCommandBySource>
  showTakeover: boolean
  allRunDefs: LabwareDefinition2[]
  labwareDefinitionsByUri: LabwareDefinitionsByUri | null
}

export interface ERUtilsResults {
  recoveryMap: IRecoveryMap
  currentRecoveryOptionUtils: CurrentRecoveryOptionUtils
  routeUpdateActions: Omit<UseRouteUpdateActionsResult, 'stashedMapRef'>
  recoveryCommands: UseRecoveryCommandsResult
  tipStatusUtils: RecoveryTipStatusUtils
  failedLabwareUtils: UseFailedLabwareUtilsResult
  failedPipetteUtils: UseFailedPipetteUtilsResult
  deckMapUtils: UseDeckMapUtilsResult
  getRecoveryOptionCopy: ReturnType<typeof useRecoveryOptionCopy>
  recoveryActionMutationUtils: RecoveryActionMutationResult
  hasLaunchedRecovery: boolean
  stepCounts: StepCounts
  commandsAfterFailedCommand: ReturnType<typeof getNextSteps>
  subMapUtils: SubMapUtils
  analytics: UseRecoveryAnalyticsResult<RecoveryRoute, RouteStep>
  doorStatusUtils: UseShowDoorInfoResult
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
  runStatus,
  showTakeover,
  allRunDefs,
  labwareDefinitionsByUri,
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

  const doorStatusUtils = useShowDoorInfo(
    runStatus,
    recoveryMap,
    recoveryMap.step
  )

  const recoveryToastUtils = useRecoveryToasts({
    currentStepCount: stepCounts.currentStepNumber,
    selectedRecoveryOption: currentRecoveryOptionUtils.selectedRecoveryOption,
    isOnDevice,
    commandTextData: protocolAnalysis,
    robotType,
    allRunDefs,
  })

  const failedPipetteUtils = useFailedPipetteUtils({
    runId,
    failedCommandByRunRecord: failedCommand?.byRunRecord ?? null,
    runRecord,
    attachedInstruments,
  })
  const { failedPipetteInfo } = failedPipetteUtils

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
    doorStatusUtils,
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
    labwareDefinitionsByUri,
  })

  const recoveryActionMutationUtils = useRecoveryActionMutation(
    runId,
    routeUpdateActions
  )

  // TODO(jh, 06-14-24): Ensure other string build utilities that are internal to ErrorRecoveryFlows are exported under
  // one utility object in useERUtils.
  const getRecoveryOptionCopy = useRecoveryOptionCopy()
  const commandsAfterFailedCommand = getNextSteps(
    failedCommand,
    protocolAnalysis,
    SUBSEQUENT_COMMAND_DEPTH
  )

  useCleanupRecoveryState({
    isTakeover: showTakeover,
    setRM,
    stashedMapRef: routeUpdateActions.stashedMapRef,
  })

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
    failedPipetteUtils,
    deckMapUtils,
    getRecoveryOptionCopy,
    stepCounts,
    commandsAfterFailedCommand,
    analytics,
    doorStatusUtils,
  }
}
