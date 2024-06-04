// This is the main unifying function for maintenanceRun and fixit type flows.
import * as React from 'react'

import { useDropTipCommandErrors } from '../utils'
import { useDropTipMaintenanceRun } from './useDropTipMaintenanceRun'
import { useDropTipCreateCommands } from './useDropTipCreateCommands'
import { useDropTipCommands } from './useDropTipCommands'

import type { ErrorDetails, SetRobotErrorDetailsParams } from '../utils'
import type { UseDropTipCommandsResult } from './useDropTipCommands'
import type { DropTipWizardFlowsProps, IssuedCommandsType } from '../..'

export type UseDTWithTypeParams = DropTipWizardFlowsProps & {
  issuedCommandsType: IssuedCommandsType
}

export interface UseDTWithTypeResult {
  activeMaintenanceRunId: string | null
  errorDetails: ErrorDetails | null
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
): UseDTWithTypeResult {
  const { issuedCommandsType, fixitCommandTypeUtils } = params

  const { isExiting, toggleIsExiting } = useIsExitingDT(issuedCommandsType)
  const { errorDetails, setErrorDetails } = useErrorDetails()

  const activeMaintenanceRunId = useDropTipMaintenanceRun({
    ...params,
    setErrorDetails,
  })
  const dtCreateCommandUtils = useDropTipCreateCommands({
    ...params,
    setErrorDetails,
    issuedCommandsType,
    activeMaintenanceRunId,
    fixitCommandTypeUtils,
  })
  const dropTipCommands = useDropTipCommands({
    ...params,
    ...dtCreateCommandUtils,
    activeMaintenanceRunId,
    setErrorDetails,
    toggleIsExiting,
  })

  return {
    activeMaintenanceRunId,
    errorDetails,
    isExiting,
    dropTipCommands,
    isCommandInProgress: dtCreateCommandUtils.isCommandInProgress,
  }
}

// Provides utilities for error state.
function useErrorDetails(): {
  errorDetails: ErrorDetails | null
  setErrorDetails: (errorDetails: SetRobotErrorDetailsParams) => void
} {
  const [errorDetails, setErrorDetails] = React.useState<null | ErrorDetails>(
    null
  )
  const setRobustErrorDetails = useDropTipCommandErrors(setErrorDetails)

  return { errorDetails, setErrorDetails: setRobustErrorDetails }
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
  const [isExiting, setIsExiting] = React.useState<boolean>(false)

  const toggleIsExiting = (): void => {
    setIsExiting(!isExiting)
  }

  const isExitingIfNotFixit = issuedCommandsType === 'fixit' ? false : isExiting

  return { isExiting: isExitingIfNotFixit, toggleIsExiting }
}
