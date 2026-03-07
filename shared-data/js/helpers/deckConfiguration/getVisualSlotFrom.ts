/**
 * This file contains helpers related to the visual slots and slot display names.
 */
import { getAASlotDisplayName } from '../..'

import type { AddressableAreaNamesWithFakes } from '../..'

export type VISUAL_SLOTS =
  | 'VSA1'
  | 'VSB1'
  | 'VSC1'
  | 'VSD1'
  | 'VSA2'
  | 'VSB2'
  | 'VSC2'
  | 'VSD2'
  | 'VSA3'
  | 'VSB3'
  | 'VSC3'
  | 'VSD3'
  | 'VSA4'
  | 'VSB4'
  | 'VSC4'
  | 'VSD4'

export const VS_TO_AA: Record<VISUAL_SLOTS, AddressableAreaNamesWithFakes[]> = {
  VSA1: [
    'A1',
    'magneticBlockV1A1',
    'temperatureModuleV2A1',
    'heaterShakerV1A1',
    'movableTrashA1',
  ],
  VSB1: [
    'B1',
    'magneticBlockV1B1',
    'temperatureModuleV2B1',
    'heaterShakerV1B1',
    'movableTrashB1',
    'thermocyclerModuleV2',
  ],
  VSC1: [
    'C1',
    'magneticBlockV1C1',
    'temperatureModuleV2C1',
    'heaterShakerV1C1',
    'movableTrashC1',
  ],
  VSD1: [
    'D1',
    'magneticBlockV1D1',
    'temperatureModuleV2D1',
    'heaterShakerV1D1',
    'movableTrashD1',
  ],
  VSA2: ['A2', 'magneticBlockV1A2'],
  VSB2: ['B2', 'magneticBlockV1B2'],
  VSC2: ['C2', 'magneticBlockV1C2'],
  VSD2: ['D2', 'magneticBlockV1D2'],
  VSA3: [
    'A3',
    'magneticBlockV1A3',
    'temperatureModuleV2A3',
    'heaterShakerV1A3',
    'movableTrashA3',
    'absorbanceReaderV1A3',
    'vacuumModuleMilliporeV1A3',
  ],
  VSB3: [
    'B3',
    'magneticBlockV1B3',
    'temperatureModuleV2B3',
    'heaterShakerV1B3',
    'movableTrashB3',
    'absorbanceReaderV1B3',
  ],
  VSC3: [
    'C3',
    'magneticBlockV1C3',
    'temperatureModuleV2C3',
    'heaterShakerV1C3',
    'movableTrashC3',
    'absorbanceReaderV1C3',
  ],
  VSD3: [
    'D3',
    'magneticBlockV1D3',
    'temperatureModuleV2D3',
    'heaterShakerV1D3',
    'movableTrashD3',
    '96ChannelWasteChute',
    '1ChannelWasteChute',
    '8ChannelWasteChute',
    'gripperWasteChute',
    'absorbanceReaderV1D3',
  ],
  VSA4: ['fakeA4', 'A4', 'flexStackerModuleV1A4'],
  VSB4: ['fakeB4', 'B4', 'flexStackerModuleV1B4'],
  VSC4: ['fakeC4', 'C4', 'flexStackerModuleV1C4'],
  VSD4: ['fakeD4', 'D4', 'flexStackerModuleV1D4'],
}

export const getVisualSlotIdFromAAId = (
  aaId: AddressableAreaNamesWithFakes
): string => {
  const vsId = Object.entries(VS_TO_AA).find(([key, value]) =>
    value.includes(aaId)
  )?.[0]
  return vsId! // should always find a match
}

export const getAAWithFakesFromVSId = (
  vsId: VISUAL_SLOTS
): AddressableAreaNamesWithFakes | null => {
  switch (vsId) {
    case 'VSA1':
      return 'A1'
    case 'VSB1':
      return 'B1'
    case 'VSC1':
      return 'C1'
    case 'VSD1':
      return 'D1'
    case 'VSA2':
      return 'A2'
    case 'VSB2':
      return 'B2'
    case 'VSC2':
      return 'C2'
    case 'VSD2':
      return 'D2'
    case 'VSA3':
      return 'A3'
    case 'VSB3':
      return 'B3'
    case 'VSC3':
      return 'C3'
    case 'VSD3':
      return 'D3'
    case 'VSA4':
      return 'fakeA4'
    case 'VSB4':
      return 'fakeB4'
    case 'VSC4':
      return 'fakeC4'
    case 'VSD4':
      return 'fakeD4'
    default:
      console.error(`could not find a match for VS:${vsId}`)
      return null
  }
}

export const getSlotDisplayNameFromAAWithFakes = (
  aaId: AddressableAreaNamesWithFakes
): string => {
  const vsId = getVisualSlotIdFromAAId(aaId as AddressableAreaNamesWithFakes)
  const slot =
    getAAWithFakesFromVSId(vsId as VISUAL_SLOTS) ??
    ('' as AddressableAreaNamesWithFakes)

  return getAASlotDisplayName(slot)
}
