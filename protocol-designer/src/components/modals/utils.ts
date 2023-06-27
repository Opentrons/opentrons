import {
  getLabwareDefURI,
  getLabwareDisplayName,
  getPipetteNameSpecs,
  PipetteName,
} from '@opentrons/shared-data'
import { LabwareDefByDefURI } from '../../labware-defs'

interface TiprackOption {
  name: string
  value: string
}

interface TiprackOptionsProps {
  allLabware: LabwareDefByDefURI
  allowAllTipracks: boolean
  selectedPipetteName?: string | null
}
export function getTiprackOptions(props: TiprackOptionsProps): TiprackOption[] {
  const { allLabware, allowAllTipracks, selectedPipetteName } = props
  const selectedPipetteDefaultTipracks =
    selectedPipetteName != null
      ? getPipetteNameSpecs(selectedPipetteName as PipetteName)
          ?.defaultTipracks ?? []
      : []
  const selectedPipetteDisplayCategory =
    selectedPipetteName != null
      ? getPipetteNameSpecs(selectedPipetteName as PipetteName)
          ?.displayCategory ?? []
      : []

  const tiprackOptions = allLabware
    ? Object.values(allLabware)
        .filter(def => def.metadata.displayCategory === 'tipRack')
        .filter(def => {
          if (allowAllTipracks && selectedPipetteDisplayCategory !== 'GEN3') {
            return !def.metadata.displayName.includes('Flex')
          } else if (
            allowAllTipracks &&
            selectedPipetteDisplayCategory === 'GEN3'
          ) {
            return def.metadata.displayName.includes('Flex')
          } else {
            return (
              selectedPipetteDefaultTipracks.includes(getLabwareDefURI(def)) ||
              def.namespace === 'custom_beta'
            )
          }
        })
        .map(def => ({
          name: getLabwareDisplayName(def),
          value: getLabwareDefURI(def),
        }))
        .sort((a, b) => (a.name.includes('(Retired)') ? 1 : -1))
    : []

  return tiprackOptions
}
