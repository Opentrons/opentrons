import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { getPipetteModelSpecs, PipetteModel } from '@opentrons/shared-data'
import type { PipetteData } from '@opentrons/api-client'
import type { Mount } from '@opentrons/components'

export interface PipetteInformation extends PipetteData {
  displayName: string
}
export type AttachedPipettesFromInstrumentsQuery = {
  [mount in Mount]: null | PipetteInformation
}

export function useAttachedPipettesFromInstrumentsQuery(): AttachedPipettesFromInstrumentsQuery {
  const { data: attachedInstruments } = useInstrumentsQuery()
  return (attachedInstruments?.data ?? []).reduce(
    (acc, instrumentData) => {
      if (instrumentData.instrumentType !== 'pipette' || !instrumentData.ok) {
        return acc
      }
      const { mount, instrumentModel } = instrumentData
      return {
        ...acc,
        [mount as Mount]: {
          ...instrumentData,
          displayName:
            instrumentModel != null
              ? getPipetteModelSpecs(instrumentModel as PipetteModel)
                  ?.displayName ?? ''
              : '',
        },
      }
    },
    { left: null, right: null }
  )
}
