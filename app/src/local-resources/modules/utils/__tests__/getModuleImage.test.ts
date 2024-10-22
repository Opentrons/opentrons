import { describe, it, expect } from 'vitest'
import { getModuleImage } from '../getModuleImage'

describe('getModuleImage', () => {
  it('should render the magnetic module image when the model is a magnetic module gen 1', () => {
    const result = getModuleImage('magneticModuleV1')
    expect(result).toEqual(
      '/app/src/assets/images/magnetic_module_gen_2_transparent.png'
    )
  })

  it('should render the high res magnetic module image when the model is a magnetic module gen 1 high res', () => {
    const result = getModuleImage('magneticModuleV1', true)
    expect(result).toEqual(
      '/app/src/assets/images/modules/magneticModuleV2@3x.png'
    )
  })

  it('should render the magnetic module image when the model is a magnetic module gen 2', () => {
    const result = getModuleImage('magneticModuleV2')
    expect(result).toEqual(
      '/app/src/assets/images/magnetic_module_gen_2_transparent.png'
    )
  })

  it('should render the temperature module image when the model is a temperature module gen 1', () => {
    const result = getModuleImage('temperatureModuleV1')
    expect(result).toEqual(
      '/app/src/assets/images/temp_deck_gen_2_transparent.png'
    )
  })

  it('should render the temperature module image when the model is a temperature module gen 2', () => {
    const result = getModuleImage('temperatureModuleV2')
    expect(result).toEqual(
      '/app/src/assets/images/temp_deck_gen_2_transparent.png'
    )
  })

  it('should render the high res temperature module image when the model is a temperature module high res', () => {
    const result = getModuleImage('temperatureModuleV2', true)
    expect(result).toEqual(
      '/app/src/assets/images/modules/temperatureModuleV2@3x.png'
    )
  })

  it('should render the heater-shaker module image when the model is a heater-shaker module gen 1', () => {
    const result = getModuleImage('heaterShakerModuleV1')
    expect(result).toEqual(
      '/app/src/assets/images/heater_shaker_module_transparent.png'
    )
  })

  it('should render the high res heater-shaker module image when the model is a heater-shaker module gen 1 high res', () => {
    const result = getModuleImage('heaterShakerModuleV1', true)
    expect(result).toEqual(
      '/app/src/assets/images/modules/heaterShakerModuleV1@3x.png'
    )
  })

  it('should render the thermocycler module image when the model is a thermocycler module gen 1', () => {
    const result = getModuleImage('thermocyclerModuleV1')
    expect(result).toEqual('/app/src/assets/images/thermocycler_closed.png')
  })

  it('should render the high res thermocycler module image when the model is a thermocycler module gen 1 high res', () => {
    const result = getModuleImage('thermocyclerModuleV1', true)
    expect(result).toEqual(
      '/app/src/assets/images/modules/thermocyclerModuleV1@3x.png'
    )
  })

  it('should render the thermocycler module image when the model is a thermocycler module gen 2', () => {
    const result = getModuleImage('thermocyclerModuleV2')
    expect(result).toEqual(
      '/app/src/assets/images/thermocycler_gen_2_closed.png'
    )
  })

  it('should render the magnetic block v1 image when the module is magneticBlockV1', () => {
    const result = getModuleImage('magneticBlockV1')
    expect(result).toEqual('/app/src/assets/images/magnetic_block_gen_1.png')
  })
})
