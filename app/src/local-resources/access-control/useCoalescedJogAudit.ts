import { useCallback, useRef } from 'react'

import { usePostLogMessageMutation } from '@opentrons/react-api-client'

import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'

export type CoalescedJogAxis = 'x' | 'y' | 'z'

export interface UseCoalescedJogAuditResult {
  recordJog: (axis: CoalescedJogAxis, dir: number, step: number) => void
  reset: () => void
  flush: () => void
}

interface JogDisplacement {
  x: number
  y: number
  z: number
}

const JOG_PIPETTE_ACTION = 'jog_pipette'
const ZERO_DISPLACEMENT: JogDisplacement = { x: 0, y: 0, z: 0 }

/**
 * Accumulates successful jog displacements and writes one signed
 * External-jog_pipette record when the user leaves the jog UI.
 * Reuses the flow's existing commandDocState so it does not re-prompt.
 */
export function useCoalescedJogAudit(
  commandDocState: DocumentationState,
  addActionToDocument: (action: DocumentedAction) => void
): UseCoalescedJogAuditResult {
  const displacementRef = useRef<JogDisplacement>({ ...ZERO_DISPLACEMENT })
  const { postLogMessage } = usePostLogMessageMutation(
    commandDocState,
    JOG_PIPETTE_ACTION
  )

  const reset = useCallback(() => {
    displacementRef.current = { ...ZERO_DISPLACEMENT }
  }, [])

  const recordJog = useCallback(
    (axis: CoalescedJogAxis, dir: number, step: number) => {
      displacementRef.current[axis] += dir * step
    },
    []
  )

  const flush = useCallback(() => {
    const displacement = displacementRef.current
    if (
      commandDocState.isLoading === false &&
      commandDocState.accessControlEnabled === true &&
      hasNetDisplacement(displacement)
    ) {
      postLogMessage({
        action: JOG_PIPETTE_ACTION,
        message: formatCoalescedJogMessage(displacement),
      })
      addActionToDocument(JOG_PIPETTE_ACTION)
    }
    reset()
  }, [addActionToDocument, commandDocState, postLogMessage, reset])

  return { recordJog, reset, flush }
}

function formatCoalescedJogMessage(displacement: JogDisplacement): string {
  return `Jogged X: ${formatAxisMm(displacement.x)}, Y: ${formatAxisMm(
    displacement.y
  )}, Z: ${formatAxisMm(displacement.z)}`
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10
}

function formatAxisMm(value: number): string {
  const rounded = roundToTenth(value)
  if (rounded === 0) {
    return '0mm'
  }
  return `${rounded.toFixed(1)}mm`
}

function hasNetDisplacement(displacement: JogDisplacement): boolean {
  return (
    roundToTenth(displacement.x) !== 0 ||
    roundToTenth(displacement.y) !== 0 ||
    roundToTenth(displacement.z) !== 0
  )
}
