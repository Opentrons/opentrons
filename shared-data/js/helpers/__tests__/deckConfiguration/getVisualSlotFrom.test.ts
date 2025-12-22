import { describe, expect, it } from 'vitest'

import {
  getSlotDisplayNameFromAAWithFakes,
  getVisualSlotIdFromAAId,
} from '../../deckConfiguration/getVisualSlotFrom'

describe('getVisualSlotIdFromAAId', () => {
  it('should get VSD4 for flexStackerModuleV1D4', () => {
    const vs = getVisualSlotIdFromAAId('flexStackerModuleV1D4')
    expect(vs).toEqual('VSD4')
  })

  it('should get VSD3 for D3', () => {
    const vs = getVisualSlotIdFromAAId('D3')
    expect(vs).toEqual('VSD3')
  })
})

describe('getSlotDisplayNameFromAAWithFakes', () => {
  it('should return slot name for regular addressable area (D3)', () => {
    const result = getSlotDisplayNameFromAAWithFakes('D3')
    expect(result).toEqual('D3')
  })

  it('should return slot name for regular addressable area (A1)', () => {
    const result = getSlotDisplayNameFromAAWithFakes('A1')
    expect(result).toEqual('A1')
  })

  it('should return slot name for module addressable area (flexStackerModuleV1D4)', () => {
    const result = getSlotDisplayNameFromAAWithFakes('flexStackerModuleV1D4')
    expect(result).toEqual('D4')
  })

  it('should return slot name for module addressable area (temperatureModuleV2A1)', () => {
    const result = getSlotDisplayNameFromAAWithFakes('temperatureModuleV2A1')
    expect(result).toEqual('A1')
  })

  it('should return slot name for fake addressable area (fakeA4)', () => {
    const result = getSlotDisplayNameFromAAWithFakes('fakeA4')
    expect(result).toEqual('A4')
  })

  it('should return slot name for fake addressable area (fakeD4)', () => {
    const result = getSlotDisplayNameFromAAWithFakes('fakeD4')
    expect(result).toEqual('D4')
  })

  it('should return slot name for magnetic block addressable area (magneticBlockV1D3)', () => {
    const result = getSlotDisplayNameFromAAWithFakes('magneticBlockV1D3')
    expect(result).toEqual('D3')
  })

  it('should return slot name for heater shaker addressable area (heaterShakerV1B3)', () => {
    const result = getSlotDisplayNameFromAAWithFakes('heaterShakerV1B3')
    expect(result).toEqual('B3')
  })
})
