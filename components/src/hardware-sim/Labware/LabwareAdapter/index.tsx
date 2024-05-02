import * as React from 'react'
import { Opentrons96DeepWellAdapter } from './Opentrons96DeepWellAdapter'
import { Opentrons96FlatBottomAdapter } from './Opentrons96FlatBottomAdapter'
import { OpentronsUniversalFlatAdapter } from './OpentronsUniversalFlatAdapter'
import { OpentronsAluminumFlatBottomPlate } from './OpentronsAluminumFlatBottomPlate'
import { OpentronsFlex96TiprackAdapter } from './OpentronsFlex96TiprackAdapter'

const LABWARE_ADAPTER_LOADNAME_PATHS = {
  opentrons_96_deep_well_adapter: Opentrons96DeepWellAdapter,
  opentrons_96_flat_bottom_adapter: Opentrons96FlatBottomAdapter,
  opentrons_aluminum_flat_bottom_plate: OpentronsAluminumFlatBottomPlate,
  opentrons_flex_96_tiprack_adapter: OpentronsFlex96TiprackAdapter,
  opentrons_universal_flat_adapter: OpentronsUniversalFlatAdapter,
}

export type LabwareAdapterLoadName = keyof typeof LABWARE_ADAPTER_LOADNAME_PATHS
export const labwareAdapterLoadNames = Object.keys(
  LABWARE_ADAPTER_LOADNAME_PATHS
)

export interface LabwareAdapterProps {
  labwareLoadName: LabwareAdapterLoadName
}

export const LabwareAdapter = (
  props: LabwareAdapterProps
): JSX.Element | null => {
  const { labwareLoadName } = props
  const SVGElement = LABWARE_ADAPTER_LOADNAME_PATHS[labwareLoadName]

  return <SVGElement />
}
