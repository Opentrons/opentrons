import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { Instruments } from '@opentrons/api-client'

import { getProtocolUsesGripper } from '/app/transformations/commands'
import {
  getAttachedGripper,
  getPipetteMatch,
} from '/app/local-resources/instruments'

export function getAreInstrumentsReady(
  analysis: CompletedProtocolAnalysis,
  attachedInstruments: Instruments
): boolean {
  const speccedPipettes = analysis?.pipettes ?? []
  const allSpeccedPipettesReady = speccedPipettes.every(loadedPipette => {
    const attachedPipetteMatch = getPipetteMatch(
      loadedPipette,
      attachedInstruments
    )
    return attachedPipetteMatch?.data.calibratedOffset?.last_modified != null
  })
  const isExtensionMountReady = getProtocolUsesGripper(analysis)
    ? getAttachedGripper(attachedInstruments)?.data.calibratedOffset
        ?.last_modified != null
    : true

  return allSpeccedPipettesReady && isExtensionMountReady
}
