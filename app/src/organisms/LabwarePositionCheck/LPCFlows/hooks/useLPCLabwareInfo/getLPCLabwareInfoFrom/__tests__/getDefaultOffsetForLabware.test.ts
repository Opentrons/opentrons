import { vi, it, describe, expect } from 'vitest'

import { ANY_LOCATION } from '@opentrons/api-client'
import { C2_ADDRESSABLE_AREA, getLabwareDefURI } from '@opentrons/shared-data'

import { getDefaultOffsetDetailsForLabware } from '../getDefaultOffsetForLabware'
import { OFFSET_KIND_DEFAULT } from '/app/redux/protocol-runs'

import type { StoredLabwareOffset } from '@opentrons/api-client'
import type { LocationSpecificOffsetDetails } from '/app/redux/protocol-runs'

vi.mock(import('@opentrons/shared-data'), async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    getLabwareDefURI: vi.fn().mockImplementation(def => 'opentrons/labware-1'),
    getModuleType: vi.fn(),
  }
})

describe('getDefaultOffsetDetailsForLabware', () => {
  const LABWARE_URI = 'opentrons/labware-1'
  const LABWARE_ID = 'labware-123'
  const ADAPTER_ID = 'adapter-456'
  const ADAPTER_URI = 'opentrons/adapter-1'

  const MOCK_LW_LOC_COMBOS = [
    { definitionUri: LABWARE_URI, labwareId: LABWARE_ID },
  ]

  const MOCK_OFFSET: StoredLabwareOffset = {
    id: 'offset-1',
    createdAt: '2023-01-01T00:00:00Z',
    definitionUri: LABWARE_URI,
    locationSequence: ANY_LOCATION,
    vector: { x: 1, y: 2, z: 3 },
  }

  const MOCK_LABWARE_DEF = {
    parameters: {
      quirks: [],
    },
  }

  const MOCK_LABWARE_DEF_WITH_QUIRK = {
    parameters: {
      quirks: ['stackingOnly'],
    },
  }

  const MOCK_LS_OFFSETS: LocationSpecificOffsetDetails[] = [
    {
      existingOffset: null,
      workingOffset: null,
      locationDetails: {
        labwareId: LABWARE_ID,
        definitionUri: LABWARE_URI,
        kind: 'location-specific',
        addressableAreaName: 'A1',
        lwOffsetLocSeq: [],
        lwModOnlyStackupDetails: [],
        closestBeneathAdapterId: ADAPTER_ID,
      },
    },
  ] as any

  const MOCK_PROTOCOL_DATA = {
    labware: [
      {
        id: ADAPTER_ID,
        definitionUri: ADAPTER_URI,
      },
    ],
    modules: [],
  }

  const MOCK_PROTOCOL_DATA_WITH_MODULES = {
    labware: [
      {
        id: ADAPTER_ID,
        definitionUri: ADAPTER_URI,
      },
    ],
    modules: [
      {
        location: { slotName: 'C2' },
      },
      {
        location: { slotName: 'A1' },
      },
    ],
  }

  it('should return default offset details with minimal params', () => {
    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      labwareDefs: [MOCK_LABWARE_DEF],
      locationSpecificOffsetDetails: [],
      protocolData: MOCK_PROTOCOL_DATA,
    } as any)

    expect(result).toEqual({
      workingOffset: null,
      existingOffset: null,
      locationDetails: {
        labwareId: LABWARE_ID,
        definitionUri: LABWARE_URI,
        kind: OFFSET_KIND_DEFAULT,
        addressableAreaName: C2_ADDRESSABLE_AREA,
        lwOffsetLocSeq: ANY_LOCATION,
        closestBeneathAdapterId: undefined,
        lwModOnlyStackupDetails: [
          {
            kind: 'labware',
            labwareUri: LABWARE_URI,
            id: LABWARE_ID,
          },
        ],
      },
    })
  })

  it('should include existing offset when found', () => {
    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [MOCK_OFFSET],
      labwareDefs: [MOCK_LABWARE_DEF],
      locationSpecificOffsetDetails: [],
      protocolData: MOCK_PROTOCOL_DATA,
    } as any)

    expect(result.existingOffset).toEqual(MOCK_OFFSET)
  })

  it('should handle labware with stackingOnly quirk', () => {
    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      labwareDefs: [MOCK_LABWARE_DEF_WITH_QUIRK],
      locationSpecificOffsetDetails: MOCK_LS_OFFSETS,
      protocolData: MOCK_PROTOCOL_DATA,
    } as any)

    expect(result.locationDetails.closestBeneathAdapterId).toBe(ADAPTER_ID)
    expect(result.locationDetails.lwModOnlyStackupDetails).toEqual([
      {
        kind: 'labware',
        labwareUri: ADAPTER_URI,
        id: ADAPTER_ID,
      },
      {
        kind: 'labware',
        labwareUri: LABWARE_URI,
        id: LABWARE_ID,
      },
    ])
  })

  it('should handle when lwLocInfo does not contain matching labware', () => {
    const result = getDefaultOffsetDetailsForLabware({
      uri: 'different-uri',
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      labwareDefs: [MOCK_LABWARE_DEF],
      locationSpecificOffsetDetails: [],
      protocolData: MOCK_PROTOCOL_DATA,
    } as any)

    expect(result.locationDetails.labwareId).toBe('')
  })

  it('should handle when no matching labware def is found', () => {
    vi.mocked(getLabwareDefURI).mockReturnValue('different-uri')

    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      labwareDefs: [MOCK_LABWARE_DEF],
      locationSpecificOffsetDetails: [],
      protocolData: MOCK_PROTOCOL_DATA,
    } as any)

    expect(result.locationDetails.closestBeneathAdapterId).toBeUndefined()
    expect(result.locationDetails.lwModOnlyStackupDetails).toHaveLength(1)
  })

  it('should handle when adapter is required but no location-specific offsets have adapters', () => {
    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      labwareDefs: [MOCK_LABWARE_DEF_WITH_QUIRK],
      locationSpecificOffsetDetails: [],
      protocolData: MOCK_PROTOCOL_DATA,
    } as any)

    expect(result.locationDetails.closestBeneathAdapterId).toBeUndefined()
    expect(result.locationDetails.lwModOnlyStackupDetails).toEqual([
      {
        kind: 'labware',
        labwareUri: LABWARE_URI,
        id: LABWARE_ID,
      },
    ])
  })

  it('should handle undefined labware defs', () => {
    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      labwareDefs: undefined,
      locationSpecificOffsetDetails: [],
      protocolData: MOCK_PROTOCOL_DATA,
    } as any)

    expect(result.locationDetails.closestBeneathAdapterId).toBeUndefined()
  })

  it('should use C2 when available and no modules are present', () => {
    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      labwareDefs: [MOCK_LABWARE_DEF],
      locationSpecificOffsetDetails: [],
      protocolData: MOCK_PROTOCOL_DATA,
    } as any)

    expect(result.locationDetails.addressableAreaName).toBe(C2_ADDRESSABLE_AREA)
  })

  it('should use alternative slot when C2 is occupied by a module', () => {
    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      labwareDefs: [MOCK_LABWARE_DEF],
      locationSpecificOffsetDetails: [],
      protocolData: MOCK_PROTOCOL_DATA_WITH_MODULES,
    } as any)

    expect(result.locationDetails.addressableAreaName).not.toBe(
      C2_ADDRESSABLE_AREA
    )
    expect([
      'A2',
      'A3',
      'B1',
      'B2',
      'B3',
      'C1',
      'C3',
      'D1',
      'D2',
      'D3',
    ]).toContain(result.locationDetails.addressableAreaName)
  })

  it('should fallback to C2 when all slots are occupied', () => {
    const protocolDataWithAllModules = {
      labware: [],
      modules: [
        { location: { slotName: 'A1' } },
        { location: { slotName: 'A2' } },
        { location: { slotName: 'A3' } },
        { location: { slotName: 'B1' } },
        { location: { slotName: 'B2' } },
        { location: { slotName: 'B3' } },
        { location: { slotName: 'C1' } },
        { location: { slotName: 'C2' } },
        { location: { slotName: 'C3' } },
        { location: { slotName: 'D1' } },
        { location: { slotName: 'D2' } },
        { location: { slotName: 'D3' } },
      ],
    }

    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      labwareDefs: [MOCK_LABWARE_DEF],
      locationSpecificOffsetDetails: [],
      protocolData: protocolDataWithAllModules,
    } as any)

    expect(result.locationDetails.addressableAreaName).toBe(C2_ADDRESSABLE_AREA)
  })
})
