import { useRef } from 'react'

import {
  moduleCleanupDuringLPCCommands,
  moveLabwareOffDeckCommands,
  retractPipetteAxesSequentiallyCommands,
  savePositionCommands,
} from './commands'

import type { LoadedPipette, Vector3D } from '@opentrons/shared-data'
import type { OffsetLocationDetails } from '/app/redux/protocol-runs'
import type { UseLPCCommandWithChainRunChildProps } from './types'

interface UseHandleConfirmPositionProps extends UseLPCCommandWithChainRunChildProps {
  setErrorMessage: (msg: string | null) => void
}

interface PendingPostConfirmCleanup {
  offsetLocationDetails: OffsetLocationDetails
  pipette: LoadedPipette
  position: Vector3D
}

export interface UseHandleConfirmPositionResult {
  /* Capture the confirmed LPC pose. Does not retract or clean up. */
  handleConfirmLwFinalPosition: (
    offsetLocationDetails: OffsetLocationDetails,
    pipette: LoadedPipette
  ) => Promise<Vector3D>
  /* Retract, module cleanup, and move labware off deck after a successful capture. */
  handlePostConfirmCleanup: () => Promise<void>
}

export function useHandleConfirmLwFinalPosition({
  setErrorMessage,
  chainLPCCommands,
}: UseHandleConfirmPositionProps): UseHandleConfirmPositionResult {
  const pendingCleanupRef = useRef<PendingPostConfirmCleanup | null>(null)

  const handleConfirmLwFinalPosition = (
    offsetLocationDetails: OffsetLocationDetails,
    pipette: LoadedPipette
  ): Promise<Vector3D> => {
    const pending = pendingCleanupRef.current

    if (
      pending != null &&
      isSameConfirmTarget(pending.offsetLocationDetails, offsetLocationDetails)
    ) {
      return Promise.resolve(pending.position)
    }

    return chainLPCCommands(savePositionCommands(pipette.id), false).then(
      responses => {
        const firstResponse = responses[0]
        if (
          firstResponse != null &&
          firstResponse.data?.commandType === 'savePosition' &&
          firstResponse.data?.result != null
        ) {
          const { position } = firstResponse.data.result
          pendingCleanupRef.current = {
            offsetLocationDetails,
            pipette,
            position,
          }
          return Promise.resolve(position)
        } else {
          setErrorMessage('CheckItem failed to save final position.')
          return Promise.reject(
            new Error('CheckItem failed to save final position.')
          )
        }
      }
    )
  }

  const handlePostConfirmCleanup = (): Promise<void> => {
    const pending = pendingCleanupRef.current
    if (pending == null) {
      return Promise.resolve()
    }

    const { offsetLocationDetails, pipette } = pending
    const cleanupCommands = [
      ...retractPipetteAxesSequentiallyCommands(pipette),
      ...moduleCleanupDuringLPCCommands(offsetLocationDetails),
      ...moveLabwareOffDeckCommands(offsetLocationDetails),
    ]

    return chainLPCCommands(cleanupCommands, false).then(() => {
      pendingCleanupRef.current = null
    })
  }

  return { handleConfirmLwFinalPosition, handlePostConfirmCleanup }
}

function isSameConfirmTarget(
  left: OffsetLocationDetails,
  right: OffsetLocationDetails
): boolean {
  return (
    left.labwareId === right.labwareId &&
    left.kind === right.kind &&
    left.addressableAreaName === right.addressableAreaName
  )
}
