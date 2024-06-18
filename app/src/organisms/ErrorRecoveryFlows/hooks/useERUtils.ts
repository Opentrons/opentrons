import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { useRouteUpdateActions } from './useRouteUpdateActions'
import { useRecoveryCommands } from './useRecoveryCommands'
import { useRecoveryTipStatus } from './useRecoveryTipStatus'
import { useRecoveryRouting } from './useRecoveryRouting'
import { useFailedLabwareUtils } from './useFailedLabwareUtils'
import { getFailedCommandPipetteInfo } from './getFailedCommandPipetteInfo'
import { useRecoveryMapUtils } from './useRecoveryMapUtils'
import {
  useNotifyAllCommandsQuery,
  useNotifyRunQuery,
} from '../../../resources/runs'
import { useRecoveryOptionCopy } from './useRecoveryOptionCopy'
import { useRunningStepCounts } from '../../../resources/protocols/hooks'

import type { PipetteData } from '@opentrons/api-client'
import type { IRecoveryMap } from '../types'
import type { ErrorRecoveryFlowsProps } from '..'
import type { UseRouteUpdateActionsResult } from './useRouteUpdateActions'
import type { UseRecoveryCommandsResult } from './useRecoveryCommands'
import type { RecoveryTipStatusUtils } from './useRecoveryTipStatus'
import type { UseFailedLabwareUtilsResult } from './useFailedLabwareUtils'
import type { UseRecoveryMapUtilsResult } from './useRecoveryMapUtils'
import type { CurrentRecoveryOptionUtils } from './useRecoveryRouting'
import type { StepCounts } from '../../../resources/protocols/hooks'

type ERUtilsProps = ErrorRecoveryFlowsProps & {
  toggleERWizard: (launchER: boolean) => Promise<void>
  hasLaunchedRecovery: boolean
}

export interface ERUtilsResults {
  recoveryMap: IRecoveryMap
  currentRecoveryOptionUtils: CurrentRecoveryOptionUtils
  routeUpdateActions: UseRouteUpdateActionsResult
  recoveryCommands: UseRecoveryCommandsResult
  tipStatusUtils: RecoveryTipStatusUtils
  failedLabwareUtils: UseFailedLabwareUtilsResult
  recoveryMapUtils: UseRecoveryMapUtilsResult
  getRecoveryOptionCopy: ReturnType<typeof useRecoveryOptionCopy>
  failedPipetteInfo: PipetteData | null
  hasLaunchedRecovery: boolean
  trackExternalMap: (map: Record<string, any>) => void
  stepCounts: StepCounts
}

// Builds various Error Recovery utilities.
export function useERUtils({
  isFlex,
  failedCommand,
  runId,
  toggleERWizard,
  hasLaunchedRecovery,
  protocolAnalysis,
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

  const {
    recoveryMap,
    setRM,
    trackExternalMap,
    currentRecoveryOptionUtils,
  } = useRecoveryRouting()

  const tipStatusUtils = useRecoveryTipStatus({
    runId,
    isFlex,
    runRecord,
    attachedInstruments,
  })

  const routeUpdateActions = useRouteUpdateActions({
    hasLaunchedRecovery,
    recoveryMap,
    toggleERWizard,
    setRecoveryMap: setRM,
  })

  const failedPipetteInfo = getFailedCommandPipetteInfo({
    failedCommand,
    runRecord,
    attachedInstruments,
  })

  const failedLabwareUtils = useFailedLabwareUtils({
    failedCommand,
    protocolAnalysis,
    failedPipetteInfo,
    runRecord,
    runCommands,
  })

  const recoveryCommands = useRecoveryCommands({
    runId,
    failedCommand,
    failedLabwareUtils,
    routeUpdateActions,
  })

  const recoveryMapUtils = useRecoveryMapUtils({
    runId,
    runRecord,
    protocolAnalysis,
    failedLabwareUtils,
  })

  const stepCounts = useRunningStepCounts(runId, runCommands)

  // TODO(jh, 06-14-24): Ensure other string build utilities that are internal to ErrorRecoveryFlows are exported under
  // one utility object in useERUtils.
  const getRecoveryOptionCopy = useRecoveryOptionCopy()

  return {
    recoveryMap,
    trackExternalMap,
    currentRecoveryOptionUtils,
    routeUpdateActions,
    recoveryCommands,
    hasLaunchedRecovery,
    tipStatusUtils,
    failedLabwareUtils,
    failedPipetteInfo,
    recoveryMapUtils,
    getRecoveryOptionCopy,
    stepCounts,
  }
}
