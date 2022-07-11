import { getAdapterName } from '../index'

describe('getAdapterName', () => {
  it(`should return the PCR adapter name`, () => {
    expect(
      getAdapterName(
        'opentrons_96_pcr_adapter_nest_wellplate_100ul_pcr_full_skirt'
      )
    ).toEqual('PCR Adapter')
  })
  it(`should return the Deep well adapter name`, () => {
    expect(
      getAdapterName('opentrons_96_deep_well_adapter_nest_wellplate_2ml_deep')
    ).toEqual('Deep Well Adapter')
  })
  it(`should return the 96 flat bottom adapter name`, () => {
    expect(
      getAdapterName(
        'opentrons_96_flat_bottom_adapter_nest_wellplate_200ul_flat'
      )
    ).toEqual('96 Flat Bottom Adapter')
  })
  it(`should return universal flat adapter name when loadname is not 1 of the 3 specified loadnames`, () => {
    expect(
      getAdapterName(
        'opentrons_universal_flat_adapter_corning_384_wellplate_112ul_flat'
      )
    ).toEqual('Universal Flat Adapter')
    expect(getAdapterName('random labware')).toEqual('Universal Flat Adapter')
  })
})
