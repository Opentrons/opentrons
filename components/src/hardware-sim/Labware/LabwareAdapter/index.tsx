import { COLORS } from '../../../helix-design-system'
import { LabwareOutline } from '../labwareInternals'
import { Opentrons96DeepWellAdapter } from './Opentrons96DeepWellAdapter'
import { Opentrons96FlatBottomAdapter } from './Opentrons96FlatBottomAdapter'
import { OpentronsAluminumFlatBottomPlate } from './OpentronsAluminumFlatBottomPlate'
import { OpentronsAutoclavableDeckRiser } from './OpentronsAutoclavableDeckRiser'
import { OpentronsFlex96TiprackAdapter } from './OpentronsFlex96TiprackAdapter'
import { OpentronsToughPCRAutoSealingLid } from './OpentronsToughPCRAutoSealingLid'
import { OpentronsUniversalFlatAdapter } from './OpentronsUniversalFlatAdapter'
import { OpentronsUniversalFlatAdapterTypeB } from './OpentronsUniversalFlatAdapterTypeB'

import type { LabwareDefinition } from '@opentrons/shared-data'

const LABWARE_ADAPTER_LOADNAME_PATHS = {
  opentrons_96_deep_well_adapter: Opentrons96DeepWellAdapter,
  opentrons_96_flat_bottom_adapter: Opentrons96FlatBottomAdapter,
  opentrons_aluminum_flat_bottom_plate: OpentronsAluminumFlatBottomPlate,
  opentrons_flex_96_tiprack_adapter: OpentronsFlex96TiprackAdapter,
  opentrons_universal_flat_adapter: OpentronsUniversalFlatAdapter,
  opentrons_universal_flat_adapter_type_b: OpentronsUniversalFlatAdapterTypeB,
  opentrons_tough_pcr_auto_sealing_lid: OpentronsToughPCRAutoSealingLid,
  opentrons_flex_deck_riser: OpentronsAutoclavableDeckRiser,
}

export type LabwareAdapterLoadName = keyof typeof LABWARE_ADAPTER_LOADNAME_PATHS
export const labwareAdapterLoadNames = Object.keys(
  LABWARE_ADAPTER_LOADNAME_PATHS
)

export interface LabwareAdapterProps {
  labwareLoadName: LabwareAdapterLoadName
  definition?: LabwareDefinition
  highlight?: boolean
  highlightShadow?: boolean
}

export const LabwareAdapter = (
  props: LabwareAdapterProps
): JSX.Element | null => {
  const {
    labwareLoadName,
    definition,
    highlight = false,
    highlightShadow,
  } = props
  const highlightOutline =
    highlight && definition != null ? (
      <LabwareOutline
        definition={definition}
        highlight={highlight}
        fill={COLORS.transparent}
      />
    ) : null
  const highlightShadowOutline =
    highlight && definition != null ? (
      <LabwareOutline
        definition={definition}
        highlight={highlight}
        highlightShadow={highlightShadow}
        fill={COLORS.transparent}
      />
    ) : null
  const SVGElement = LABWARE_ADAPTER_LOADNAME_PATHS[labwareLoadName]

  return (
    <g>
      {/**
       * render an initial shadow outline first in the DOM so that the SVG highlight shadow
       * does not layer over the inside of the SVG labware adapter
       */}
      {highlightShadowOutline}
      <SVGElement />
      {highlightOutline}
    </g>
  )
}
