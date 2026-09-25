import { COLORS } from '../../../helix-design-system'
import { LabwareOutline } from '../labwareInternals'
import { GenericLid } from './GenericLid'
import { Opentrons96DeepWellAdapter } from './Opentrons96DeepWellAdapter'
import { Opentrons96FlatBottomAdapter } from './Opentrons96FlatBottomAdapter'
import { OpentronsAluminumFlatBottomPlate } from './OpentronsAluminumFlatBottomPlate'
import { OpentronsAutoclavableDeckRiser } from './OpentronsAutoclavableDeckRiser'
import { OpentronsFlex96TiprackAdapter } from './OpentronsFlex96TiprackAdapter'
import { OpentronsToughPCRAutoSealingLid } from './OpentronsToughPCRAutoSealingLid'
import { OpentronsUniversalFlatAdapter } from './OpentronsUniversalFlatAdapter'
import { OpentronsUniversalFlatAdapterTypeB } from './OpentronsUniversalFlatAdapterTypeB'
import { OpentronsVacuumManifoldCollar } from './OpentronsVacuumManifoldCollar'
import { OpentronsVacuumManifoldSpacer } from './OpentronsVacuumManifoldSpacer'

import type { LabwareDefinition } from '@opentrons/shared-data'

const CUSTOM_SVG_LOADNAME_PATHS = {
  opentrons_96_deep_well_adapter: Opentrons96DeepWellAdapter,
  opentrons_96_flat_bottom_adapter: Opentrons96FlatBottomAdapter,
  opentrons_aluminum_flat_bottom_plate: OpentronsAluminumFlatBottomPlate,
  opentrons_flex_96_tiprack_adapter: OpentronsFlex96TiprackAdapter,
  opentrons_universal_flat_adapter: OpentronsUniversalFlatAdapter,
  opentrons_universal_flat_adapter_type_b: OpentronsUniversalFlatAdapterTypeB,
  opentrons_tough_pcr_auto_sealing_lid: OpentronsToughPCRAutoSealingLid,
  opentrons_flex_deck_riser: OpentronsAutoclavableDeckRiser,
  opentrons_vacuum_manifold_collar_short: OpentronsVacuumManifoldCollar,
  opentrons_vacuum_manifold_collar_tall: OpentronsVacuumManifoldCollar,
  opentrons_vacuum_manifold_spacer_short: OpentronsVacuumManifoldSpacer,
  opentrons_vacuum_manifold_spacer_tall: OpentronsVacuumManifoldSpacer,
}

export type LabwareAdapterLoadName = keyof typeof CUSTOM_SVG_LOADNAME_PATHS
export const customSVGLoadNames = Object.keys(CUSTOM_SVG_LOADNAME_PATHS)

export interface LabwareAdapterProps {
  labwareLoadName: LabwareAdapterLoadName
  lidDimensions: {
    xDimension: number
    yDimension: number
    zDimension: number
  } | null
  definition?: LabwareDefinition
  highlight?: boolean
  highlightShadow?: boolean
  isLid?: boolean
}

export const LabwareAdapter = (
  props: LabwareAdapterProps
): JSX.Element | null => {
  const {
    labwareLoadName,
    definition,
    highlight = false,
    highlightShadow,
    isLid = false,
    lidDimensions,
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

  //  TODO(ja, 27.8.25): find a way to simplify this logic more?
  //  but the PCR auto-sealing lid will always be special-cased here
  const isGenericLid =
    isLid && labwareLoadName !== 'opentrons_tough_pcr_auto_sealing_lid'

  const SVGElement = isGenericLid
    ? GenericLid
    : CUSTOM_SVG_LOADNAME_PATHS[labwareLoadName]

  return (
    <g>
      {/**
       * render an initial shadow outline first in the DOM so that the SVG highlight shadow
       * does not layer over the inside of the SVG labware adapter
       */}
      {highlightShadowOutline}
      <SVGElement lidDimensions={lidDimensions} />
      {highlightOutline}
    </g>
  )
}
