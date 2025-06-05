import { describe, expect, it, vi } from 'vitest'

import { ANY_LOCATION } from '@opentrons/api-client'
import {
  C3_ADDRESSABLE_AREA,
  C2_ADDRESSABLE_AREA,
  getLabwareDefURI,
} from '@opentrons/shared-data'

import { OFFSET_KIND_DEFAULT } from '/app/redux/protocol-runs'

import { getDefaultOffsetDetailsForLabware } from '../getDefaultOffsetForLabware'

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
    {
      definitionUri: LABWARE_URI,
      labwareId: LABWARE_ID,
      addressableAreaName: 'A1',
      closestBeneathModuleId: null,
    },
  ]

  const MOCK_LW_LOC_COMBOS_WITH_MODULE = [
    {
      definitionUri: LABWARE_URI,
      labwareId: LABWARE_ID,
      addressableAreaName: 'A1',
      closestBeneathModuleId: 'module-123',
    },
    {
      definitionUri: 'other-labware',
      labwareId: 'other-labware-id',
      addressableAreaName: 'B2',
      closestBeneathModuleId: null,
    },
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

  const MOCK_PROTOCOL_DATA_WITH_C2_MODULE = {
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

  it('should find first location with no module when C2 is occupied', () => {
    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS_WITH_MODULE,
      currentOffsets: [],
      labwareDefs: [MOCK_LABWARE_DEF],
      locationSpecificOffsetDetails: [],
      protocolData: MOCK_PROTOCOL_DATA_WITH_C2_MODULE,
    } as any)

    expect(result.locationDetails.addressableAreaName).toBe('B2')
  })

  it('should fallback to C3 when C2 is occupied and no locations without modules are found', () => {
    const lwLocInfoAllWithModules = [
      {
        definitionUri: LABWARE_URI,
        labwareId: LABWARE_ID,
        addressableAreaName: 'A1' as any,
        closestBeneathModuleId: 'module-1',
      },
      {
        definitionUri: 'other-labware',
        labwareId: 'other-labware-id',
        addressableAreaName: 'B2' as any,
        closestBeneathModuleId: 'module-2',
      },
    ]

    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: lwLocInfoAllWithModules,
      currentOffsets: [],
      labwareDefs: [MOCK_LABWARE_DEF],
      locationSpecificOffsetDetails: [],
      protocolData: MOCK_PROTOCOL_DATA_WITH_C2_MODULE,
    } as any)

    expect(result.locationDetails.addressableAreaName).toBe(C3_ADDRESSABLE_AREA)
  })

  it('should return C2 when C2 is not occupied by modules', () => {
    const result = getDefaultOffsetDetailsForLabware({
      uri: LABWARE_URI,
      lwLocInfo: MOCK_LW_LOC_COMBOS,
      currentOffsets: [],
      labwareDefs: [MOCK_LABWARE_DEF],
      locationSpecificOffsetDetails: [],
      protocolData: {
        labware: [],
        modules: [
          { location: { slotName: 'A1' } },
          { location: { slotName: 'B1' } },
        ],
      },
    } as any)

    expect(result.locationDetails.addressableAreaName).toBe(C2_ADDRESSABLE_AREA)
  })
})
