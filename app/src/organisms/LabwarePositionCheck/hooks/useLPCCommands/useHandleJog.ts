import { useCallback, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import debounce from 'lodash/debounce'

import { useCreateMaintenanceCommandMutation } from '@opentrons/react-api-client'

import { selectActivePipette } from '/app/redux/protocol-runs'

import { moveRelativeCommand, moveToWellCommands } from './commands'

import type { VectorOffset } from '@opentrons/api-client'
import type { Vector3D } from '@opentrons/shared-data'
import type {
  Axis,
  Jog,
  Sign,
  StepSize,
} from '/app/molecules/JogControls/types'
import type { OffsetLocationDetails } from '/app/redux/protocol-runs'
import type { UseLPCCommandWithChainRunChildProps } from './types'

const JOG_COMMAND_TIMEOUT_MS = 10000
const MAX_QUEUED_JOGS = 3
const DEBOUNCE_TIME_MS = 50

interface UseHandleJogProps extends UseLPCCommandWithChainRunChildProps {
  setErrorMessage: (msg: string | null) => void
}

export interface UseHandleJogResult {
  handleJog: Jog
  resetJog: (
    offsetLocationDetails: OffsetLocationDetails,
    pipetteId: string,
    offset?: VectorOffset | null
  ) => Promise<void>
}

// TODO(jh, 01-21-25): Extract the throttling logic into its own hook that lives elsewhere and is used by other Jog flows.

export function useHandleJog({
  runId,
  maintenanceRunId,
  setErrorMessage,
  chainLPCCommands,
  commandDocState,
}: UseHandleJogProps): UseHandleJogResult {
  const pipette = useSelector(selectActivePipette(runId))
  const pipetteId = pipette?.id
  const { createMaintenanceCommand: createSilentCommand } =
    useCreateMaintenanceCommandMutation(commandDocState)

  const queueRef = useRef<
    Array<{
      axis: Axis
      dir: Sign
      step: StepSize
      onSuccess?: (position: Vector3D | null) => void
    }>
  >([])
  const processingRef = useRef(false)

  const processNextInQueue = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) {
      return
    }

    processingRef.current = true
    const nextJog = queueRef.current.shift()

    if (nextJog == null) {
      processingRef.current = false
      return
    }

    const { axis, dir, step, onSuccess } = nextJog

    if (pipetteId != null) {
      createSilentCommand({
        maintenanceRunId,
        command: moveRelativeCommand({ pipetteId, axis, dir, step }),
        waitUntilComplete: true,
        timeout: JOG_COMMAND_TIMEOUT_MS,
      })
        .then(data => {
          onSuccess?.((data?.data?.result?.position ?? null) as Vector3D | null)
        })
        .catch((e: Error) => {
          setErrorMessage(`Error issuing jog command: ${e.message}`)
        })
        .finally(() => {
          processingRef.current = false
          // Use setTimeout to ensure we're outside the current call stack.
          // This helps prevent stack overflow with rapid queue processing.
          setTimeout(() => {
            processNextInQueue()
          }, DEBOUNCE_TIME_MS)
        })
    } else {
      const error = new Error(
        `Could not find pipette to jog with id: ${pipetteId ?? ''}`
      )
      setErrorMessage(error.message)
      processingRef.current = false
      setTimeout(() => {
        processNextInQueue()
      }, DEBOUNCE_TIME_MS)
    }
  }, [pipetteId, maintenanceRunId, createSilentCommand, setErrorMessage])

  // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedProcessQueue = useCallback(
    debounce(
      () => {
        processNextInQueue()
      },
      DEBOUNCE_TIME_MS,
      { leading: true, trailing: true }
    ),
    [processNextInQueue]
  )

  // Clear the queue on dismount so the pipette doesn't continue to jog.
  useEffect(() => {
    return () => {
      debouncedProcessQueue.cancel()
    }
  }, [debouncedProcessQueue])

  const handleJog = useCallback(
    (
      axis: Axis,
      dir: Sign,
      step: StepSize,
      onSuccess?: (position: Vector3D | null) => void
    ): void => {
      if (queueRef.current.length < MAX_QUEUED_JOGS) {
        queueRef.current.push({ axis, dir, step, onSuccess })
        debouncedProcessQueue()
      }
    },
    [debouncedProcessQueue]
  )

  const resetJog = useCallback(
    (
      offsetLocationDetails: OffsetLocationDetails,
      pipetteId: string,
      offset?: VectorOffset | null
    ): Promise<void> => {
      queueRef.current = []

      const resetJogCommands = [
        ...moveToWellCommands(offsetLocationDetails, pipetteId, offset),
      ]

      return chainLPCCommands(resetJogCommands, false).then(() =>
        Promise.resolve()
      )
    },
    [chainLPCCommands]
  )

  return { handleJog, resetJog }
}
