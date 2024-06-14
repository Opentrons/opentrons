import { useInstrumentsQuery } from '@opentrons/react-api-client'

import { useRouteUpdateActions } from './useRouteUpdateActions'
import { useRecoveryCommands } from './useRecoveryCommands'
import { useRecoveryTipStatus } from './useRecoveryTipStatus'
import { useRecoveryRouting } from './useRecoveryRouting'
import { usePreviousRecoveryRoute } from './usePreviousRecoveryRoute'
import { useFailedLabwareUtils } from './useFailedLabwareUtils'
import { useFailedCommandPipetteInfo } from './useFailedCommandPipetteInfo'
import { useNotifyRunQuery } from '../../../resources/runs'

import type { PipetteData } from '@opentrons/api-client'
import type { IRecoveryMap, RecoveryRoute } from '../types'
import type { ErrorRecoveryFlowsProps } from '..'
import type { UseRouteUpdateActionsResult } from './useRouteUpdateActions'
import type { UseRecoveryCommandsResult } from './useRecoveryCommands'
import type { RecoveryTipStatusUtils } from './useRecoveryTipStatus'
import type { UseFailedLabwareUtilsResult } from './useFailedLabwareUtils'

type ERUtilsProps = ErrorRecoveryFlowsProps & {
  toggleERWizard: (launchER: boolean) => Promise<void>
  hasLaunchedRecovery: boolean
}

export interface ERUtilsResults {
  recoveryMap: IRecoveryMap
  previousRoute: RecoveryRoute | null
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

  const { recoveryMap, setRM, trackExternalMap } = useRecoveryRouting()
  const previousRoute = usePreviousRecoveryRoute(recoveryMap.route)
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
    runRecord,
    failedPipetteInfo,
  })

  const recoveryCommands = useRecoveryCommands({
    runId,
    failedCommand,
    failedLabwareUtils,
    failedPipetteInfo,
  })

  return {
    recoveryMap,
    trackExternalMap,
    previousRoute,
    routeUpdateActions,
    recoveryCommands,
    hasLaunchedRecovery,
    tipStatusUtils,
    failedLabwareUtils,
    failedPipetteInfo,
  }
}
