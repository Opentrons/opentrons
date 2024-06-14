import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { useRouteUpdateActions } from './useRouteUpdateActions'
import { useRecoveryCommands } from './useRecoveryCommands'
import { useRecoveryTipStatus } from './useRecoveryTipStatus'
import { useRecoveryRouting } from './useRecoveryRouting'
import { useFailedLabwareUtils } from './useFailedLabwareUtils'
import { useFailedCommandPipetteInfo } from './useFailedCommandPipetteInfo'
import {
  useNotifyAllCommandsQuery,
  useNotifyRunQuery,
} from '../../../resources/runs'

import type { PipetteData } from '@opentrons/api-client'
import type { IRecoveryMap } from '../types'
import type { ErrorRecoveryFlowsProps } from '..'
import type { UseRouteUpdateActionsResult } from './useRouteUpdateActions'
import type { UseRecoveryCommandsResult } from './useRecoveryCommands'
import type { RecoveryTipStatusUtils } from './useRecoveryTipStatus'
import type { UseFailedLabwareUtilsResult } from './useFailedLabwareUtils'
import type { CurrentRecoveryOptionUtils } from './useRecoveryRouting'

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
  failedPipetteInfo: PipetteData | null
  hasLaunchedRecovery: boolean
  trackExternalMap: (map: Record<string, any>) => void
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
  // from runCommands once the server yields that info directly on an existing/new endpoint.
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

  const failedPipetteInfo = useFailedCommandPipetteInfo({
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
  })

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
  }
}
