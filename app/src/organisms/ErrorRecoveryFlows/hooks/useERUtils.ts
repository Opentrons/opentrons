import { useMemo } from 'react'

import {
  useInstrumentsQuery,
  useRunCurrentState,
} from '@opentrons/react-api-client'

import { useRecoveryAnalytics } from '/app/redux-resources/analytics'
import { getRunningStepCountsFrom } from '/app/resources/protocols'
import {
  useNotifyAllCommandsQuery,
  useNotifyRunQuery,
} from '/app/resources/runs'

import { getNextSteps } from '../utils'
import { useCleanupRecoveryState } from './useCleanupRecoveryState'
import { useDeckMapUtils } from './useDeckMapUtils'
import { useFailedLabwareUtils } from './useFailedLabwareUtils'
import { useFailedPipetteUtils } from './useFailedPipetteUtils'
import { useRecoveryActionMutation } from './useRecoveryActionMutation'
import { useRecoveryCommands } from './useRecoveryCommands'
import { useRecoveryOptionCopy } from './useRecoveryOptionCopy'
import { useRecoveryRouting } from './useRecoveryRouting'
import { useRecoveryTipStatus } from './useRecoveryTipStatus'
import { useRecoveryToasts } from './useRecoveryToasts'
import { useRouteUpdateActions } from './useRouteUpdateActions'
import { useShowDoorInfo } from './useShowDoorInfo'

import type { LabwareDefinition, RobotType } from '@opentrons/shared-data'
import type { UseRecoveryAnalyticsResult } from '/app/redux-resources/analytics'
import type { StepCounts } from '/app/resources/protocols/hooks'
import type { ErrorRecoveryFlowsProps } from '..'
import type { IRecoveryMap, RecoveryRoute, RouteStep } from '../types'
import type { UseDeckMapUtilsResult } from './useDeckMapUtils'
import type { UseFailedLabwareUtilsResult } from './useFailedLabwareUtils'
import type { UseFailedPipetteUtilsResult } from './useFailedPipetteUtils'
import type { RecoveryActionMutationResult } from './useRecoveryActionMutation'
import type { UseRecoveryCommandsResult } from './useRecoveryCommands'
import type {
  CurrentRecoveryOptionUtils,
  SubMapUtils,
} from './useRecoveryRouting'
import type { UseRecoveryTakeoverResult } from './useRecoveryTakeover'
import type { RecoveryTipStatusUtils } from './useRecoveryTipStatus'
import type { useRetainedFailedCommandBySource } from './useRetainedFailedCommandBySource'
import type { UseRouteUpdateActionsResult } from './useRouteUpdateActions'
import type { UseShowDoorInfoResult } from './useShowDoorInfo'

export type ERUtilsProps = Omit<ErrorRecoveryFlowsProps, 'failedCommand'> & {
  toggleERWizAsActiveUser: UseRecoveryTakeoverResult['toggleERWizAsActiveUser']
  hasLaunchedRecovery: boolean
  isOnDevice: boolean
  robotType: RobotType
  failedCommand: ReturnType<typeof useRetainedFailedCommandBySource>
  isActiveUser: UseRecoveryTakeoverResult['isActiveUser']
  allRunDefs: LabwareDefinition[]
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
  isActiveUser,
  allRunDefs,
  unvalidatedFailedCommand,
  runLwDefsByUri,
}: ERUtilsProps): ERUtilsResults {
  const { data: attachedInstruments } = useInstrumentsQuery()
  const { data: runRecord } = useNotifyRunQuery(runId)
  const { data: runCurrentState } = useRunCurrentState(runId)
  // TODO(jh, 06-04-24): Refactor the utilities that derive info
  // from runCommands once the server yields that info directly on an existing/new endpoint. We'll still need this with a
  // pageLength of 1 though for stepCount things.
  // Note that pageLength: 999 is ok only because we fetch this on mount. We use 999 because it should hopefully
  // provide the commands necessary for ER without taxing the server too heavily. This is NOT intended for produciton!
  const { data: runCommands } = useNotifyAllCommandsQuery(runId, {
    pageLength: 999,
  })

  const stepCounts = useMemo(
    () =>
      getRunningStepCountsFrom(
        protocolAnalysis?.commands ?? [],
        failedCommand?.byRunRecord ?? null
      ),
    [protocolAnalysis, failedCommand]
  )

  const analytics = useRecoveryAnalytics()

  const { recoveryMap, setRM, currentRecoveryOptionUtils, ...subMapUtils } =
    useRecoveryRouting()

  const doorStatusUtils = useShowDoorInfo(
    runStatus,
    recoveryMap,
    recoveryMap.step
  )

  const recoveryToastUtils = useRecoveryToasts({
    stepCounts,
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
    failedCommand,
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
    failedCommand,
    protocolAnalysis,
    failedPipetteInfo,
    runRecord,
    runCommands,
    runCurrentState,
  })

  const recoveryCommands = useRecoveryCommands({
    runId,
    failedCommand,
    unvalidatedFailedCommand,
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
    runLwDefsByUri,
    recoveryMap,
  })

  // TODO (jj): popup doc modal in desktop app
  const recoveryActionMutationUtils = useRecoveryActionMutation(
    runId,
    routeUpdateActions,
    { reasonForInteractionRequired: false }
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
    isActiveUser,
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
