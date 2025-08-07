import { DEFINED_ERROR_TYPES, ERROR_KINDS } from '../constants'

import type { FailedCommandBySource } from '/app/organisms/ErrorRecoveryFlows/hooks'
import type { ErrorKind } from '../types'

/**
 * Given server-side information about a failed command,
 * decide which UI flow to present to recover from it.
 *
 * NOTE IMPORTANT: Any failed command by run record must have an equivalent protocol analysis command or default
 * to the fallback general error. Prefer using FailedCommandBySource for this reason.
 */
export function getErrorKind(
  failedCommand: FailedCommandBySource | null
): ErrorKind {
  const failedCommandByRunRecord = failedCommand?.byRunRecord ?? null
  const commandType = failedCommandByRunRecord?.commandType
  const errorIsDefined = failedCommandByRunRecord?.error?.isDefined ?? false
  const errorType = failedCommandByRunRecord?.error?.errorType

  if (Boolean(errorIsDefined)) {
    switch (errorType) {
      case DEFINED_ERROR_TYPES.OVERPRESSURE:
        // The recovery flow varies dependent on the exact failed command.
        switch (commandType) {
          case 'prepareToAspirate':
            return ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE
          case 'aspirate':
          case 'aspirateInPlace': {
            return ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING
          }
          case 'dispense':
          case 'dispenseInPlace':
          case 'blowout':
          case 'blowOutInPlace':
            return ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING
          default: {
            console.error(`Unhandled overpressure command ${commandType}`)
            return ERROR_KINDS.GENERAL_ERROR
          }
        }
      case DEFINED_ERROR_TYPES.LIQUID_NOT_FOUND:
        return ERROR_KINDS.NO_LIQUID_DETECTED
      case DEFINED_ERROR_TYPES.TIP_PHYSICALLY_MISSING:
        return ERROR_KINDS.TIP_NOT_DETECTED
      case DEFINED_ERROR_TYPES.TIP_PHYSICALLY_ATTACHED:
        return ERROR_KINDS.TIP_DROP_FAILED
      case DEFINED_ERROR_TYPES.GRIPPER_MOVEMENT:
        return ERROR_KINDS.GRIPPER_ERROR
      case DEFINED_ERROR_TYPES.STALL_OR_COLLISION:
        return ERROR_KINDS.STALL_OR_COLLISION
      case DEFINED_ERROR_TYPES.STACKER_STALL:
        return ERROR_KINDS.STACKER_STALLED
      case DEFINED_ERROR_TYPES.HOPPER_LABWARE_MISSING:
        return ERROR_KINDS.STACKER_HOPPER_EMPTY
      case DEFINED_ERROR_TYPES.STACKER_SHUTTLE_MISSING:
        return ERROR_KINDS.STACKER_SHUTTLE_MISSING
      case DEFINED_ERROR_TYPES.STACKER_SHUTTLE_EMPTY:
        return ERROR_KINDS.STACKER_SHUTTLE_EMPTY
      case DEFINED_ERROR_TYPES.STACKER_SHUTTLE_OCCUPIED:
        return ERROR_KINDS.STACKER_SHUTTLE_OCCUPIED
      default: {
        console.error(`Unhandled error type ${errorType}`)
        return ERROR_KINDS.GENERAL_ERROR
      }
    }
  } else {
    console.warn(
      `Run status is "awaiting for recovery", but error is not defined: ${failedCommandByRunRecord}`
    )
    return ERROR_KINDS.GENERAL_ERROR
  }
}
