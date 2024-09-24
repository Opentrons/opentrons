import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import { usePipetteModelSpecs } from '/app/local-resources/instruments'

import type { PipetteData } from '@opentrons/api-client'
import type { Mount } from '@opentrons/components'
import type { PipetteModel } from '@opentrons/shared-data'
import type { PipetteInformation } from '/app/redux/pipettes'

export type AttachedPipettesFromInstrumentsQuery = {
  [mount in Mount]: null | PipetteInformation
}
export function useAttachedPipettesFromInstrumentsQuery(): AttachedPipettesFromInstrumentsQuery {
  const attachedInstruments = useInstrumentsQuery()?.data?.data ?? []

  const okPipettes = attachedInstruments.filter(
    (instrument): instrument is PipetteData =>
      instrument.instrumentType === 'pipette' && instrument.ok
  )

  const leftPipette = okPipettes.find(({ mount }) => mount === LEFT) ?? null
  const rightPipette = okPipettes.find(({ mount }) => mount === RIGHT) ?? null

  const leftDisplayName =
    usePipetteModelSpecs(leftPipette?.instrumentModel as PipetteModel)
      ?.displayName ?? ''
  const rightDisplayName =
    usePipetteModelSpecs(rightPipette?.instrumentModel as PipetteModel)
      ?.displayName ?? ''

  return {
    [LEFT]:
      leftPipette != null
        ? { ...leftPipette, displayName: leftDisplayName }
        : null,
    [RIGHT]:
      rightPipette != null
        ? { ...rightPipette, displayName: rightDisplayName }
        : null,
  }
}
