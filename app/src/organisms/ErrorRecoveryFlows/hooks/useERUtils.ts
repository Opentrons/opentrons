import { useRouteUpdateActions } from './useRouteUpdateActions'
import { useRecoveryCommands } from './useRecoveryCommands'
import { useRecoveryTipStatus } from './useRecoveryTipStatus'
import { useRecoveryRouting } from './useRecoveryRouting'
import { usePreviousRecoveryRoute } from './usePreviousRecoveryRoute'

import type { IRecoveryMap, RecoveryRoute } from '../types'
import type { ErrorRecoveryFlowsProps } from '..'
import type { UseRouteUpdateActionsResult } from './useRouteUpdateActions'
import type { UseRecoveryCommandsResult } from './useRecoveryCommands'
import type { RecoveryTipStatusUtils } from './useRecoveryTipStatus'

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
}: ERUtilsProps): ERUtilsResults {
  const { recoveryMap, setRM, trackExternalMap } = useRecoveryRouting()
  const previousRoute = usePreviousRecoveryRoute(recoveryMap.route)
  const tipStatusUtils = useRecoveryTipStatus(runId, isFlex)
  const routeUpdateActions = useRouteUpdateActions({
    hasLaunchedRecovery,
    recoveryMap,
    toggleERWizard,
    setRecoveryMap: setRM,
  })
  const recoveryCommands = useRecoveryCommands({
    runId,
    failedCommand,
  })

  return {
    recoveryMap,
    trackExternalMap,
    previousRoute,
    routeUpdateActions,
    recoveryCommands,
    hasLaunchedRecovery,
    tipStatusUtils,
  }
}
