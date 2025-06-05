import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getLabwareDefURI } from '@opentrons/shared-data'

import { appendUniqValidLocCombo } from '../appendUniqValidLocCombo'

import type { LabwareDefinition } from '@opentrons/shared-data'
import type { LabwareLocationInfoWithLocSeq } from '..'

vi.mock('@opentrons/shared-data', () => ({
  FLEX_STAGING_ADDRESSABLE_AREAS: ['A1', 'C2'],
  getLabwareDefURI: vi.fn(),
}))

describe('appendUniqValidLocCombo', () => {
  const LABWARE_ID = 'labware-1'
  const LABWARE_URI = 'labware-1'
  const ADAPTER_ID = 'adapter-1'
  const MODULE_ID = 'module-1'
  const MODULE_MODEL = 'thermocyclerModuleV2'
  const ADDRESSABLE_AREA = 'B1'

  const BASIC_LABWARE_DEF: LabwareDefinition = {
    metadata: { displayName: 'Basic Labware' },
  } as LabwareDefinition

  const LID_LABWARE_DEF: LabwareDefinition = {
    metadata: { displayName: 'Lid Labware' },
    allowedRoles: ['lid'],
  } as LabwareDefinition

  const ADAPTER_LABWARE_DEF: LabwareDefinition = {
    metadata: { displayName: 'Adapter Labware' },
    allowedRoles: ['adapter'],
  } as LabwareDefinition

  const SYSTEM_LABWARE_DEF: LabwareDefinition = {
    metadata: { displayName: 'System Labware' },
    allowedRoles: ['system'],
  } as LabwareDefinition

  const BASIC_LOCATION_COMBO: LabwareLocationInfoWithLocSeq = {
    labwareId: LABWARE_ID,
    definitionUri: LABWARE_URI,
    addressableAreaName: ADDRESSABLE_AREA,
    closestBeneathModuleId: MODULE_ID,
    closestBeneathModuleModel: MODULE_MODEL,
    closestBeneathAdapterId: ADAPTER_ID,
    lwModOnlyStackupDetails: [],
    lwOffsetLocSeq: [
      { kind: 'onAddressableArea', addressableAreaName: ADDRESSABLE_AREA },
    ],
    locationSequence: [
      { kind: 'onAddressableArea', addressableAreaName: ADDRESSABLE_AREA },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLabwareDefURI).mockImplementation((def: any) => {
      if (def === BASIC_LABWARE_DEF) {
        return LABWARE_URI
      }
      if (def === LID_LABWARE_DEF) {
        return 'lid-labware'
      }
      if (def === ADAPTER_LABWARE_DEF) {
        return 'adapter-labware'
      }
      if (def === SYSTEM_LABWARE_DEF) {
        return 'system-labware'
      } else {
        return ''
      }
    })
  })

  it('should return unchanged accumulator when combo is null', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = [BASIC_LOCATION_COMBO]
    const lwDefs: LabwareDefinition[] = [BASIC_LABWARE_DEF]

    const result = appendUniqValidLocCombo(acc, lwDefs, null)

    expect(result).toBe(acc)
  })

  it('should append valid and unique combo to accumulator', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = []
    const lwDefs: LabwareDefinition[] = [BASIC_LABWARE_DEF]

    const result = appendUniqValidLocCombo(acc, lwDefs, BASIC_LOCATION_COMBO)

    expect(result).toEqual([BASIC_LOCATION_COMBO])
  })

  it('should not append combo that already exists in accumulator', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = [BASIC_LOCATION_COMBO]
    const lwDefs: LabwareDefinition[] = [BASIC_LABWARE_DEF]

    const result = appendUniqValidLocCombo(acc, lwDefs, BASIC_LOCATION_COMBO)

    expect(result).toEqual([BASIC_LOCATION_COMBO])
  })

  it('should not append combo with same offset sequence and definition URI', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = [BASIC_LOCATION_COMBO]
    const lwDefs: LabwareDefinition[] = [BASIC_LABWARE_DEF]

    const similarCombo: LabwareLocationInfoWithLocSeq = {
      ...BASIC_LOCATION_COMBO,
      labwareId: 'different-id',
    }

    const result = appendUniqValidLocCombo(acc, lwDefs, similarCombo)

    expect(result).toEqual([BASIC_LOCATION_COMBO])
  })

  it('should not append combo when labware definition is not found', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = []
    const lwDefs: LabwareDefinition[] = []

    const result = appendUniqValidLocCombo(acc, lwDefs, BASIC_LOCATION_COMBO)

    expect(result).toEqual([])
  })

  it('should not append combo with lid role', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = []
    const lwDefs: LabwareDefinition[] = [LID_LABWARE_DEF]

    const lidCombo: LabwareLocationInfoWithLocSeq = {
      ...BASIC_LOCATION_COMBO,
      definitionUri: 'lid-labware',
    }

    const result = appendUniqValidLocCombo(acc, lwDefs, lidCombo)

    expect(result).toEqual([])
  })

  it('should not append combo with adapter role', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = []
    const lwDefs: LabwareDefinition[] = [ADAPTER_LABWARE_DEF]

    const adapterCombo: LabwareLocationInfoWithLocSeq = {
      ...BASIC_LOCATION_COMBO,
      definitionUri: 'adapter-labware',
    }

    const result = appendUniqValidLocCombo(acc, lwDefs, adapterCombo)

    expect(result).toEqual([])
  })

  it('should not append combo with system role', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = []
    const lwDefs: LabwareDefinition[] = [SYSTEM_LABWARE_DEF]

    const systemCombo: LabwareLocationInfoWithLocSeq = {
      ...BASIC_LOCATION_COMBO,
      definitionUri: 'system-labware',
    }

    const result = appendUniqValidLocCombo(acc, lwDefs, systemCombo)

    expect(result).toEqual([])
  })

  it('should not append combo with empty offset location sequence', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = []
    const lwDefs: LabwareDefinition[] = [BASIC_LABWARE_DEF]

    const comboWithEmptyOffsetLocSeq: LabwareLocationInfoWithLocSeq = {
      ...BASIC_LOCATION_COMBO,
      lwOffsetLocSeq: [],
    }

    const result = appendUniqValidLocCombo(
      acc,
      lwDefs,
      comboWithEmptyOffsetLocSeq
    )

    expect(result).toEqual([])
  })

  it('should not append combo with notOnDeck kind', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = []
    const lwDefs: LabwareDefinition[] = [BASIC_LABWARE_DEF]

    const notOnDeckCombo: LabwareLocationInfoWithLocSeq = {
      ...BASIC_LOCATION_COMBO,
      locationSequence: [
        { kind: 'onAddressableArea', addressableAreaName: ADDRESSABLE_AREA },
        { kind: 'notOnDeck', logicalLocationName: 'offDeck' },
      ],
    }

    const result = appendUniqValidLocCombo(acc, lwDefs, notOnDeckCombo)

    expect(result).toEqual([])
  })

  it('should not append combo with inStackerHopper kind', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = []
    const lwDefs: LabwareDefinition[] = [BASIC_LABWARE_DEF]

    const inStackerHopperCombo: LabwareLocationInfoWithLocSeq = {
      ...BASIC_LOCATION_COMBO,
      locationSequence: [
        { kind: 'onAddressableArea', addressableAreaName: ADDRESSABLE_AREA },
        { kind: 'inStackerHopper', moduleId: 'mock-module-id' },
      ],
    }

    const result = appendUniqValidLocCombo(acc, lwDefs, inStackerHopperCombo)

    expect(result).toEqual([])
  })

  it('should not append combo in staging area', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = []
    const lwDefs: LabwareDefinition[] = [BASIC_LABWARE_DEF]

    const stagingAreaCombo: LabwareLocationInfoWithLocSeq = {
      ...BASIC_LOCATION_COMBO,
      addressableAreaName: 'A1',
      locationSequence: [
        { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      ],
      lwOffsetLocSeq: [
        { kind: 'onAddressableArea', addressableAreaName: 'A1' },
      ],
    }

    const result = appendUniqValidLocCombo(acc, lwDefs, stagingAreaCombo)

    expect(result).toEqual([])
  })

  it('should append valid combo with allowed roles that are not lid, adapter, or system', () => {
    const acc: LabwareLocationInfoWithLocSeq[] = []
    const otherRoleLabwareDef: LabwareDefinition = {
      metadata: { displayName: 'Other Role Labware' },
      allowedRoles: ['tipRack'],
    } as any

    vi.mocked(getLabwareDefURI).mockImplementation((def: any) => {
      if (def === otherRoleLabwareDef) {
        return 'other-role-labware'
      } else {
        return ''
      }
    })

    const lwDefs: LabwareDefinition[] = [otherRoleLabwareDef]

    const otherRoleCombo: LabwareLocationInfoWithLocSeq = {
      ...BASIC_LOCATION_COMBO,
      definitionUri: 'other-role-labware',
    }

    const result = appendUniqValidLocCombo(acc, lwDefs, otherRoleCombo)

    expect(result).toEqual([otherRoleCombo])
  })
})
