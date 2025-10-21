import { describe, expect, it, vi } from 'vitest'

import { ANY_LOCATION } from '@opentrons/api-client'

import { OFFSET_KIND_LOCATION_SPECIFIC } from '/app/redux/protocol-runs'

import { getLocationSpecificOffsetDetailsForLabware } from '../getLocationSpecificOffsetDetailsForLabware'

import type { StoredLabwareOffset } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'

vi.mock('/app/local-resources/offsets', () => ({
  getLwOffsetLocSeqFromLocSeq: vi.fn().mockImplementation(locSeq => locSeq),
}))

describe('getLocationSpecificOffsetDetailsForLabware', () => {
  const LABWARE_URI = 'opentrons/labware-1'
  const LABWARE_ID = 'labware-123'
  const OFFSET_ID = 'offset-456'

  const MOCK_OFFSET_LOC_SEQ = [
    { kind: 'onAddressableArea', addressableAreaName: 'A1' },
  ]

  const MOCK_LW_LOC_COMBOS = [
    {
      definitionUri: LABWARE_URI,
      labwareId: LABWARE_ID,
      lwOffsetLocSeq: MOCK_OFFSET_LOC_SEQ,
      addressableAreaName: 'A1',
      lwModOnlyStackupDetails: [],
    },
  ]

  const MOCK_OFFSET: StoredLabwareOffset = {
    id: OFFSET_ID,
    createdAt: '2023-01-01T00:00:00Z',
    definitionUri: LABWARE_URI,
    locationSequence: MOCK_OFFSET_LOC_SEQ,
    vector: { x: 1, y: 2, z: 3 },
  } as any

  const MOCK_LOAD_COMMAND = {
    commandType: 'loadLabware',
    result: {
      labwareId: LABWARE_ID,
      locationSequence: MOCK_OFFSET_LOC_SEQ,
    },
  }

  const MOCK_PROTOCOL_DATA: CompletedProtocolAnalysis = {
    labware: [
      {
        id: LABWARE_ID,
        definitionUri: LABWARE_URI,
        offsetId: OFFSET_ID,
      },
    ],
    commands: [MOCK_LOAD_COMMAND],
    modules: [],
  } as any

  it('should return empty array when no offsets match the URI', () => {
    const result = getLocationSpecificOffsetDetailsForLabware({
      uri: 'different-uri',
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      protocolData: null,
    } as any)

    expect(result).toEqual([])
  })

  it('should return location specific offset details when URI matches', () => {
    const result = getLocationSpecificOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      protocolData: null,
    } as any)

    expect(result).toEqual([
      {
        existingOffset: null,
        workingOffset: null,
        locationDetails: {
          labwareId: LABWARE_ID,
          definitionUri: LABWARE_URI,
          kind: OFFSET_KIND_LOCATION_SPECIFIC,
          addressableAreaName: 'A1',
          lwOffsetLocSeq: MOCK_OFFSET_LOC_SEQ,
          lwModOnlyStackupDetails: [],
          hardCodedOffsetId: null,
        },
      },
    ])
  })

  it('should filter out ANY_LOCATION entries', () => {
    const combosWithAnyLocation = [
      ...MOCK_LW_LOC_COMBOS,
      {
        definitionUri: LABWARE_URI,
        labwareId: LABWARE_ID,
        lwOffsetLocSeq: ANY_LOCATION,
        addressableAreaName: 'A2',
        lwModOnlyStackupDetails: [],
      },
    ]

    const result = getLocationSpecificOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: combosWithAnyLocation,
      currentOffsets: [],
      protocolData: null,
    } as any)

    expect(result.length).toBe(1)
    expect(result[0].locationDetails.addressableAreaName).toBe('A1')
  })

  it('should include existing offset when one matches', () => {
    const result = getLocationSpecificOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [MOCK_OFFSET],
      protocolData: null,
    } as any)

    expect(result[0].existingOffset).toEqual(MOCK_OFFSET)
  })

  it('should set hardCodedOffsetId when protocol data includes matching offset', () => {
    const result = getLocationSpecificOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      protocolData: MOCK_PROTOCOL_DATA,
    } as any)

    expect(result[0].locationDetails.hardCodedOffsetId).toBe(OFFSET_ID)
  })

  it('should handle null protocol data', () => {
    const result = getLocationSpecificOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      protocolData: null,
    } as any)

    expect(result[0].locationDetails.hardCodedOffsetId).toBe(null)
  })

  it('should handle when no labware has offsetId', () => {
    const protocolDataWithoutOffsetId = {
      ...MOCK_PROTOCOL_DATA,
      labware: [
        {
          id: LABWARE_ID,
          definitionUri: LABWARE_URI,
        },
      ],
    }

    const result = getLocationSpecificOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      protocolData: protocolDataWithoutOffsetId,
    } as any)

    expect(result[0].locationDetails.hardCodedOffsetId).toBe(null)
  })

  it('should handle multiple location-specific offsets', () => {
    const multipleLocations = [
      ...MOCK_LW_LOC_COMBOS,
      {
        definitionUri: LABWARE_URI,
        labwareId: 'labware-456',
        lwOffsetLocSeq: [
          { kind: 'onAddressableArea', addressableAreaName: 'B1' },
        ],
        addressableAreaName: 'B1',
        lwModOnlyStackupDetails: [],
      },
    ]

    const result = getLocationSpecificOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: multipleLocations,
      currentOffsets: [],
      protocolData: null,
    } as any)

    expect(result.length).toBe(2)
    expect(result[0].locationDetails.addressableAreaName).toBe('A1')
    expect(result[1].locationDetails.addressableAreaName).toBe('B1')
  })
})
