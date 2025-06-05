import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getLabwareDefURI } from '@opentrons/shared-data'

import { getLwOffsetLocSeqFromLocSeq } from '/app/local-resources/offsets'

import { getLoadLabwareLocationCombo } from '../getLoadLabwareLocationCombo'
import {
  getAddressableAreaNameFrom,
  getClosestBeneathAdapterId,
  getClosestBeneathModuleId,
  getClosestBeneathModuleModel,
  getLwModStackupDetails,
} from '../helpers'

import type {
  LoadedLabware,
  LoadedModule,
  LoadLabwareRunTimeCommand,
} from '@opentrons/shared-data'

vi.mock('@opentrons/shared-data', () => ({
  getLabwareDefURI: vi.fn(),
}))
vi.mock('../helpers')
vi.mock('/app/local-resources/offsets')

describe('getLoadLabwareLocationCombo', () => {
  const LABWARE_ID = 'labware-123'
  const LABWARE_URI = 'labware-1'
  const ADAPTER_ID = 'adapter-456'
  const MODULE_ID = 'module-789'
  const MODULE_MODEL = 'thermocyclerModuleV2'
  const ADDRESSABLE_AREA = 'B1'

  const LABWARE_DEFINITION = { metadata: { displayName: 'Test Labware' } }

  const LOCATION_SEQUENCE = [
    { kind: 'onAddressableArea', addressableAreaName: ADDRESSABLE_AREA },
  ]

  const OFFSET_LOCATION_SEQUENCE = [
    { kind: 'onAddressableArea', addressableAreaName: ADDRESSABLE_AREA },
  ]

  const LW_MOD_STACKUP_DETAILS = [
    { kind: 'labware', labwareUri: LABWARE_URI, id: LABWARE_ID },
  ]

  const MOCK_LABWARE: LoadedLabware[] = [
    { id: LABWARE_ID, definitionUri: LABWARE_URI },
  ] as LoadedLabware[]

  const MOCK_MODULES: LoadedModule[] = [
    { id: MODULE_ID, model: MODULE_MODEL },
  ] as LoadedModule[]

  const MOCK_LOAD_COMMAND: LoadLabwareRunTimeCommand = {
    commandType: 'loadLabware',
    params: { labwareId: LABWARE_ID },
    result: {
      labwareId: LABWARE_ID,
      definition: LABWARE_DEFINITION,
      locationSequence: LOCATION_SEQUENCE,
    },
  } as LoadLabwareRunTimeCommand

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(getLabwareDefURI).mockReturnValue(LABWARE_URI)
    vi.mocked(getAddressableAreaNameFrom).mockReturnValue(ADDRESSABLE_AREA)
    vi.mocked(getClosestBeneathModuleId).mockReturnValue(MODULE_ID)
    vi.mocked(getClosestBeneathModuleModel).mockReturnValue(MODULE_MODEL)
    vi.mocked(getClosestBeneathAdapterId).mockReturnValue(ADAPTER_ID)
    vi.mocked(getLwOffsetLocSeqFromLocSeq).mockReturnValue(
      OFFSET_LOCATION_SEQUENCE as any
    )
    vi.mocked(getLwModStackupDetails).mockReturnValue(
      LW_MOD_STACKUP_DETAILS as any
    )
  })

  it('should return null when result is null', () => {
    const commandWithNullResult = {
      ...MOCK_LOAD_COMMAND,
      result: null,
    }

    const result = getLoadLabwareLocationCombo(
      commandWithNullResult as any,
      MOCK_LABWARE,
      MOCK_MODULES
    )

    expect(result).toBeNull()
  })

  it('should return null when locationSequence is null', () => {
    const commandWithNullLocSeq = {
      ...MOCK_LOAD_COMMAND,
      result: {
        ...MOCK_LOAD_COMMAND.result,
        locationSequence: null,
      },
    }

    const result = getLoadLabwareLocationCombo(
      commandWithNullLocSeq as any,
      MOCK_LABWARE,
      MOCK_MODULES
    )

    expect(result).toBeNull()
  })

  it('should return null when addressableAreaName is null', () => {
    vi.mocked(getAddressableAreaNameFrom).mockReturnValue(null)

    const result = getLoadLabwareLocationCombo(
      MOCK_LOAD_COMMAND,
      MOCK_LABWARE,
      MOCK_MODULES
    )

    expect(result).toBeNull()
    expect(getAddressableAreaNameFrom).toHaveBeenCalledWith(LOCATION_SEQUENCE)
  })

  it('should return location combo when all required information is available', () => {
    const result = getLoadLabwareLocationCombo(
      MOCK_LOAD_COMMAND,
      MOCK_LABWARE,
      MOCK_MODULES
    )

    expect(result).toEqual({
      labwareId: LABWARE_ID,
      closestBeneathModuleId: MODULE_ID,
      closestBeneathModuleModel: MODULE_MODEL,
      definitionUri: LABWARE_URI,
      locationSequence: LOCATION_SEQUENCE,
      lwOffsetLocSeq: OFFSET_LOCATION_SEQUENCE,
      addressableAreaName: ADDRESSABLE_AREA,
      lwModOnlyStackupDetails: LW_MOD_STACKUP_DETAILS,
      closestBeneathAdapterId: ADAPTER_ID,
    })

    expect(getLabwareDefURI).toHaveBeenCalledWith(LABWARE_DEFINITION)
    expect(getAddressableAreaNameFrom).toHaveBeenCalledWith(LOCATION_SEQUENCE)
    expect(getClosestBeneathModuleId).toHaveBeenCalledWith(LOCATION_SEQUENCE)
    expect(getClosestBeneathModuleModel).toHaveBeenCalledWith(
      MODULE_ID,
      MOCK_MODULES
    )
    expect(getLwOffsetLocSeqFromLocSeq).toHaveBeenCalledWith(
      LOCATION_SEQUENCE,
      MOCK_LABWARE,
      MOCK_MODULES
    )
    expect(getLwModStackupDetails).toHaveBeenCalledWith(
      OFFSET_LOCATION_SEQUENCE,
      LOCATION_SEQUENCE,
      LABWARE_ID,
      LABWARE_URI
    )
    expect(getClosestBeneathAdapterId).toHaveBeenCalledWith(LOCATION_SEQUENCE)
  })

  it('should handle when moduleId is undefined', () => {
    vi.mocked(getClosestBeneathModuleId).mockReturnValue(undefined)
    vi.mocked(getClosestBeneathModuleModel).mockReturnValue(undefined)

    const result = getLoadLabwareLocationCombo(
      MOCK_LOAD_COMMAND,
      MOCK_LABWARE,
      MOCK_MODULES
    )

    expect(result).not.toBeNull()
    expect(result?.closestBeneathModuleId).toBeUndefined()
    expect(result?.closestBeneathModuleModel).toBeUndefined()
    expect(getClosestBeneathModuleModel).toHaveBeenCalledWith(
      undefined,
      MOCK_MODULES
    )
  })

  it('should handle when adapterId is undefined', () => {
    vi.mocked(getClosestBeneathAdapterId).mockReturnValue(undefined)

    const result = getLoadLabwareLocationCombo(
      MOCK_LOAD_COMMAND,
      MOCK_LABWARE,
      MOCK_MODULES
    )

    expect(result).not.toBeNull()
    expect(result?.closestBeneathAdapterId).toBeUndefined()
  })
})
