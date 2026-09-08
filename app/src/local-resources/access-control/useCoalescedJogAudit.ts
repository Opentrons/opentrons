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

interface RecordedJog {
  axis: CoalescedJogAxis
  distanceMm: number
}

const JOG_PIPETTE_ACTION = 'jog_pipette'

/**
 * Accumulates each successful jog and writes one signed External-jog_pipette
 * record per press when the user leaves the jog UI. Reuses the flow's
 * existing commandDocState so it does not re-prompt.
 */
export function useCoalescedJogAudit(
  commandDocState: DocumentationState,
  addActionToDocument: (action: DocumentedAction) => void
): UseCoalescedJogAuditResult {
  const jogsRef = useRef<RecordedJog[]>([])
  const { postLogMessage } = usePostLogMessageMutation(
    commandDocState,
    JOG_PIPETTE_ACTION
  )

  const reset = useCallback(() => {
    jogsRef.current = []
  }, [])

  const recordJog = useCallback(
    (axis: CoalescedJogAxis, dir: number, step: number) => {
      const distanceMm = dir * step
      if (distanceMm === 0) {
        return
      }
      jogsRef.current.push({ axis, distanceMm })
    },
    []
  )

  const flush = useCallback(() => {
    const jogs = jogsRef.current
    if (
      commandDocState.isLoading === false &&
      commandDocState.accessControlEnabled === true &&
      jogs.length > 0
    ) {
      jogs.forEach(jog => {
        postLogMessage({
          action: JOG_PIPETTE_ACTION,
          message: formatJogMessage(jog),
        })
      })
      addActionToDocument(JOG_PIPETTE_ACTION)
    }
    reset()
  }, [addActionToDocument, commandDocState, postLogMessage, reset])

  return { recordJog, reset, flush }
}

function formatJogMessage({ axis, distanceMm }: RecordedJog): string {
  return `Jogged ${axis.toUpperCase()}: ${distanceMm.toFixed(1)}mm`
}
