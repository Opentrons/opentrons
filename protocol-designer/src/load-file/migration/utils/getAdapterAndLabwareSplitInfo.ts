export type AdapterAndLabware = {
  labwareLoadname: string
  adapterLoadname: string
  labwareDisplayName: string
  adapterDisplayName: string
}

export const getAdapterAndLabwareSplitInfo = (
  labwareId: string
): AdapterAndLabware => {
  console.log('labwareId', labwareId)
  if (
    labwareId.includes('opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep')
  ) {
    return {
      labwareLoadname: 'nest__96_wellplate_2ml_deep',
      adapterLoadname: 'opentrons_96_deep_well_adapter',
      labwareDisplayName: 'NEST 96 Deep Well Plate 2mL',
      adapterDisplayName: 'Opentrons 96 Deep Well Adapter',
    }
  } else if (
    labwareId.includes(
      'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat'
    )
  ) {
    return {
      labwareLoadname: 'nest_96_wellplate_200ul_flat',
      adapterLoadname: 'opentrons_96_flat_bottom_adapter',
      labwareDisplayName: 'NEST 96 Well Plate 200 µL Flat',
      adapterDisplayName: 'Opentrons 96 Flat Bottom Adapter',
    }
  } else if (
    labwareId.includes(
      'opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt'
    )
  ) {
    return {
      labwareLoadname: 'nest_96_wellplate_100ul_pcr_full_skirt',
      adapterLoadname: 'opentrons_96_pcr_adapter',
      labwareDisplayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
      adapterDisplayName: 'Opentrons 96 PCR Adapter',
    }
  } else if (
    labwareId.includes(
      'opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat'
    )
  ) {
    return {
      labwareLoadname: 'corning_384_wellplate_112ul_flat',
      adapterLoadname: 'opentrons_universal_flat_adapter',
      labwareDisplayName: 'Corning 384 Well Plate 112 µL Flat',
      adapterDisplayName: 'Opentrons Universal Flat Adapter',
    }
  } else if (
    labwareId.includes('opentrons_96_aluminumblock_biorad_wellplate_200ul')
  ) {
    return {
      labwareLoadname: 'opentrons_96_aluminumblock',
      adapterLoadname: 'biorad_wellplate_200ul',
      labwareDisplayName: 'Bio-Rad 96 Well Plate 200 µL PCR',
      adapterDisplayName: 'Opentrons 96 Well Aluminum Block',
    }
  } else if (
    labwareId.includes('opentrons_96_aluminumblock_nest_wellplate_100ul')
  ) {
    return {
      labwareLoadname: 'opentrons_96_aluminumblock',
      adapterLoadname: 'nest_wellplate_100ul',
      labwareDisplayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
      adapterDisplayName: 'Opentrons 96 Well Aluminum Block',
    }
  } else {
    //  default
    return {
      labwareLoadname: '',
      adapterLoadname: '',
      labwareDisplayName: '',
      adapterDisplayName: '',
    }
  }
}
