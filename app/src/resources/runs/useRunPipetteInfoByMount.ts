import { useStoredProtocolAnalysis } from '/app/resources/analysis'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'
import { INCOMPATIBLE, MATCH } from '/app/resources/runs/constants'

import { useMostRecentCompletedAnalysis } from './useMostRecentCompletedAnalysis'

import type { Mount } from '@opentrons/api-client'
import type { LoadPipetteRunTimeCommand } from '@opentrons/shared-data'
import type { PipetteInformation } from '/app/resources/instruments/types'
import type { PipetteInfo } from '/app/resources/runs/types'

const EMPTY_MOUNTS = { left: null, right: null }

export function useRunPipetteInfoByMount(runId: string): {
  [mount in Mount]: PipetteInfo | null
} {
  const robotProtocolAnalysis = useMostRecentCompletedAnalysis(runId)

  const storedProtocolAnalysis = useStoredProtocolAnalysis(runId)
  const protocolData = robotProtocolAnalysis ?? storedProtocolAnalysis
  const attachedPipettes = useAttachedPipettesFromInstrumentsQuery()

  if (protocolData == null) {
    return EMPTY_MOUNTS
  }
  const { pipettes, commands } = protocolData
  const loadPipetteCommands = commands.filter(
    (command): command is LoadPipetteRunTimeCommand =>
      command.commandType === 'loadPipette'
  )

  return pipettes.reduce((acc, pipette) => {
    const loadCommand = loadPipetteCommands.find(
      command => command.result?.pipetteId === pipette.id
    )
    if (loadCommand != null) {
      const { mount } = loadCommand.params
      const attachedPipette = attachedPipettes[mount as Mount]
      const requestedPipetteMatch = getRequestedPipetteMatch(
        pipette.pipetteName,
        attachedPipette
      )

      return {
        ...acc,
        [mount]: {
          requestedPipetteMatch,
        },
      }
    } else {
      return acc
    }
  }, EMPTY_MOUNTS)
}

function getRequestedPipetteMatch(
  requestedPipetteName: string,
  attachedPipette: PipetteInformation | null
): string {
  if (requestedPipetteName === attachedPipette?.instrumentName) {
    return MATCH
  } else {
    return INCOMPATIBLE
  }
}
