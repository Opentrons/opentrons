// This is the main unifying function for maintenanceRun and fixit type flows.
import { useState } from 'react'

import { useMaintenanceRunDocumentation } from '/app/local-resources/access-control/useMaintenanceRunDocumentation'

import { useDropTipCommandErrors } from '.'
import { useDropTipCommands } from './useDropTipCommands'
import { useDropTipCreateCommands } from './useDropTipCreateCommands'
import { useDropTipMaintenanceRun } from './useDropTipMaintenanceRun'

import type { SetRobotErrorDetailsParams } from '.'
import type { DropTipWizardFlowsProps } from '..'
import type { ErrorDetails, IssuedCommandsType } from '../types'
import type { UseDropTipCommandsResult } from './useDropTipCommands'

export type UseDTWithTypeParams = DropTipWizardFlowsProps & {
  issuedCommandsType: IssuedCommandsType
}

export interface UseDropTipWithTypeResult {
  activeMaintenanceRunId: string | null
  errorDetails: ErrorDetails | null
  clearErrorDetails: () => void
  isExiting: boolean
  isCommandInProgress: boolean
  dropTipCommands: UseDropTipCommandsResult
}

/**
 * Manages all the logic relating to command type, either "setup" or "fixit", returning related state and
 * action-generating commands.
 *
 * If command type is "setup" this will include maintenance run management.
 */
export function useDropTipWithType(
  params: UseDTWithTypeParams
): UseDropTipWithTypeResult {
  const { issuedCommandsType, fixitCommandTypeUtils, closeFlow } = params

  const { isExiting, toggleIsExiting } = useIsExitingDT(issuedCommandsType)
  const { errorDetails, setErrorDetails, clearErrorDetails } = useErrorDetails()
  const {
    commandDocState,
    deletionDocState,
    actionsToDocument,
    addActionToDocument,
  } = useMaintenanceRunDocumentation(
    'drop_tips',
    // Prefer the fixit cancel handler so ER does not re-enter drop tip (and
    // re-prompt) when the user backs out of documentation.
    fixitCommandTypeUtils?.onDocumentationCancel ?? closeFlow
  )
  const activeMaintenanceRunId = useDropTipMaintenanceRun({
    ...params,
    setErrorDetails,
    commandDocState,
    actionsToDocument,
    addActionToDocument,
  })

  const dtCreateCommandUtils = useDropTipCreateCommands({
    ...params,
    setErrorDetails,
    issuedCommandsType,
    activeMaintenanceRunId,
    fixitCommandTypeUtils,
    commandDocState,
    actionsToDocument,
    addActionToDocument,
  })
  const dropTipCommands = useDropTipCommands({
    ...params,
    ...dtCreateCommandUtils,
    activeMaintenanceRunId,
    setErrorDetails,
    toggleIsExiting,
    fixitCommandTypeUtils,
    deletionDocState,
    actionsToDocument,
  })

  return {
    activeMaintenanceRunId,
    errorDetails,
    clearErrorDetails,
    isExiting,
    dropTipCommands,
    isCommandInProgress: dtCreateCommandUtils.isCommandInProgress,
  }
}

// Provides utilities for error state.
function useErrorDetails(): {
  errorDetails: ErrorDetails | null
  setErrorDetails: (errorDetails: SetRobotErrorDetailsParams) => void
  clearErrorDetails: () => void
} {
  const [errorDetails, setErrorDetails] = useState<null | ErrorDetails>(null)
  const setRobustErrorDetails = useDropTipCommandErrors(setErrorDetails)

  const clearErrorDetails = (): void => {
    setErrorDetails(null)
  }

  return {
    errorDetails,
    setErrorDetails: setRobustErrorDetails,
    clearErrorDetails,
  }
}

/**
 * Provides utilities for drop tip exit state.
 *
 * NOTE: Exit state is always disabled for "fixit" commands.
 */
function useIsExitingDT(
  issuedCommandsType: UseDTWithTypeParams['issuedCommandsType']
): {
  /* Always returns false if command type is "fixit". */
  isExiting: boolean
  toggleIsExiting: () => void
} {
  const [isExiting, setIsExiting] = useState<boolean>(false)

  const toggleIsExiting = (): void => {
    setIsExiting(!isExiting)
  }

  const isExitingIfNotFixit = issuedCommandsType === 'fixit' ? false : isExiting

  return { isExiting: isExitingIfNotFixit, toggleIsExiting }
}
