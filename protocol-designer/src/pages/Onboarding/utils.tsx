import {
  FLEX_96_CHANNEL_PIPETTES,
  getLabwareDefURI,
  getLabwareDisplayName,
  getPipetteSpecsV2,
} from '@opentrons/shared-data'

import type {
  LabwareDef2ByDefURI,
  LabwareDefinition2,
  PipetteName,
} from '@opentrons/shared-data'

interface TiprackOptionsProps {
  allLabware: LabwareDef2ByDefURI
  allowAllTipracks: boolean
  selectedPipetteName?: string | null
}
//  returns a hashmap of LabwareDefUri : displayName
export function getTiprackOptions(
  props: TiprackOptionsProps
): Record<string, string> {
  const { allLabware, allowAllTipracks, selectedPipetteName } = props

  if (!allLabware) return {}

  const pipetteSpecs = selectedPipetteName
    ? getPipetteSpecsV2(selectedPipetteName as PipetteName)
    : null

  const defaultTipracks = pipetteSpecs?.liquids.default.defaultTipracks ?? []
  const displayCategory = pipetteSpecs?.displayCategory ?? ''
  const isFlexPipette =
    displayCategory === 'FLEX' ||
    (selectedPipetteName != null &&
      FLEX_96_CHANNEL_PIPETTES.includes(selectedPipetteName))

  const tiprackOptionsMap = Object.values(allLabware)
    .filter(def => def.metadata.displayCategory === 'tipRack')
    .filter(def => {
      if (allowAllTipracks) {
        return isFlexPipette
          ? def.metadata.displayName.includes('Flex') ||
              def.namespace === 'custom_beta'
          : !def.metadata.displayName.includes('Flex') ||
              def.namespace === 'custom_beta'
      }
      return (
        defaultTipracks.includes(getLabwareDefURI(def)) ||
        def.namespace === 'custom_beta'
      )
    })
    .reduce((acc: Record<string, string>, def: LabwareDefinition2) => {
      const displayName = getLabwareDisplayName(def)
      const name =
        def.parameters.loadName.includes('flex') && isFlexPipette
          ? displayName.split('Opentrons Flex')[1]
          : displayName
      acc[getLabwareDefURI(def)] = name
      return acc
    }, {})

  return tiprackOptionsMap
}

/**
 * Return tiprack URIs valid for PD (present in labwareDefs) for a pipette when
 * importing deck config. Prefers pipette default tipracks that exist; otherwise
 * the first compatible Flex tiprack in labwareDefs.
 */
export function getValidTiprackURIsForImport(
  pipetteName: PipetteName,
  labwareDefs: LabwareDef2ByDefURI
): string[] | undefined {
  const options = getTiprackOptions({
    allLabware: labwareDefs,
    allowAllTipracks: false,
    selectedPipetteName: pipetteName,
  })
  const validUris = Object.keys(options)
  if (validUris.length === 0) return undefined
  const defaultTipracks =
    getPipetteSpecsV2(pipetteName)?.liquids?.default?.defaultTipracks ?? []
  const preferred = defaultTipracks.find(uri => validUris.includes(uri))
  return preferred != null ? [preferred] : [validUris[0]]
}
