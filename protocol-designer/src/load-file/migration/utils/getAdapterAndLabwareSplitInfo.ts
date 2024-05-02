export interface AdapterAndLabware {
  labwareUri: string
  adapterUri: string
  labwareDisplayName: string
  adapterDisplayName: string
}

export const getAdapterAndLabwareSplitInfo = (
  labwareId: string
): AdapterAndLabware => {
  if (
    labwareId.includes('opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep')
  ) {
    return {
      labwareUri: 'opentrons/nest_96_wellplate_2ml_deep/2',
      adapterUri: 'opentrons/opentrons_96_deep_well_adapter/1',
      labwareDisplayName: 'NEST 96 Deep Well Plate 2mL',
      adapterDisplayName: 'Opentrons 96 Deep Well Adapter',
    }
  } else if (
    labwareId.includes(
      'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat'
    )
  ) {
    return {
      labwareUri: 'opentrons/nest_96_wellplate_200ul_flat/2',
      adapterUri: 'opentrons/opentrons_96_flat_bottom_adapter/1',
      labwareDisplayName: 'NEST 96 Well Plate 200 µL Flat',
      adapterDisplayName: 'Opentrons 96 Flat Bottom Adapter',
    }
  } else if (
    labwareId.includes(
      'opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt'
    )
  ) {
    return {
      labwareUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/2',
      adapterUri: 'opentrons/opentrons_96_pcr_adapter/1',
      labwareDisplayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
      adapterDisplayName: 'Opentrons 96 PCR Adapter',
    }
  } else if (
    labwareId.includes(
      'opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat'
    )
  ) {
    return {
      labwareUri: 'opentrons/corning_384_wellplate_112ul_flat/2',
      adapterUri: 'opentrons/opentrons_universal_flat_adapter/1',
      labwareDisplayName: 'Corning 384 Well Plate 112 µL Flat',
      adapterDisplayName: 'Opentrons Universal Flat Adapter',
    }
  } else if (
    labwareId.includes('opentrons_96_aluminumblock_biorad_wellplate_200ul')
  ) {
    return {
      adapterUri: 'opentrons/opentrons_96_well_aluminum_block/1',
      labwareUri: 'opentrons/biorad_96_wellplate_200ul_pcr/2',
      labwareDisplayName: 'Bio-Rad 96 Well Plate 200 µL PCR',
      adapterDisplayName: 'Opentrons 96 Well Aluminum Block',
    }
  } else if (
    labwareId.includes('opentrons_96_aluminumblock_nest_wellplate_100ul')
  ) {
    return {
      adapterUri: 'opentrons/opentrons_96_well_aluminum_block/1',
      labwareUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/2',
      labwareDisplayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
      adapterDisplayName: 'Opentrons 96 Well Aluminum Block',
    }
  } else {
    //  default - shouldn't reach this!
    return {
      labwareUri: '',
      adapterUri: '',
      labwareDisplayName: '',
      adapterDisplayName: '',
    }
  }
}
