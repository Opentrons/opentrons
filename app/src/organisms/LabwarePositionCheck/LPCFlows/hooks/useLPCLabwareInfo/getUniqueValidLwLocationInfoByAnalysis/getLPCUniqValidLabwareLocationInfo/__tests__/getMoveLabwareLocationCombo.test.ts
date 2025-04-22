import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getLwOffsetLocSeqFromLocSeq } from '/app/local-resources/offsets'

import { getMoveLabwareLocationCombo } from '../getMoveLabwareLocationCombo'
import {
  getAddressableAreaNameFrom,
  getClosestBeneathAdapterId,
  getClosestBeneathModuleId,
  getClosestBeneathModuleModel,
  getLabwareDefURIFrom,
  getLwModStackupDetails,
} from '../helpers'

import type {
  LoadedLabware,
  LoadedModule,
  MoveLabwareRunTimeCommand,
} from '@opentrons/shared-data'
import type { AnalysisLwURIsByLwId } from '../getAllPossibleLwURIsInRun'

vi.mock('../helpers')
vi.mock('/app/local-resources/offsets')

describe('getMoveLabwareLocationCombo', () => {
  const LABWARE_ID = 'labware-123'
  const LABWARE_URI = 'opentrons/labware-1'
  const ADAPTER_ID = 'adapter-456'
  const MODULE_ID = 'module-789'
  const MODULE_MODEL = 'thermocyclerModuleV2'
  const ADDRESSABLE_AREA = 'B1'

  const LOCATION_SEQUENCE = [
    { kind: 'onAddressableArea', addressableAreaName: ADDRESSABLE_AREA },
  ]

  const OFFSET_LOCATION_SEQUENCE = [
    { kind: 'onAddressableArea', addressableAreaName: ADDRESSABLE_AREA },
  ]

  const LW_MOD_STACKUP_DETAILS = [
    { kind: 'labware', labwareUri: LABWARE_URI, id: LABWARE_ID },
  ]

  const MOCK_LW_URIS_BY_ID: AnalysisLwURIsByLwId = {
    [LABWARE_ID]: LABWARE_URI,
  }

  const MOCK_LABWARE: LoadedLabware[] = [
    { id: LABWARE_ID, definitionUri: LABWARE_URI },
  ] as LoadedLabware[]

  const MOCK_MODULES: LoadedModule[] = [
    { id: MODULE_ID, model: MODULE_MODEL },
  ] as LoadedModule[]

  const MOCK_MOVE_COMMAND: MoveLabwareRunTimeCommand = {
    commandType: 'moveLabware',
    params: { labwareId: LABWARE_ID },
    result: {
      eventualDestinationLocationSequence: LOCATION_SEQUENCE,
    },
  } as MoveLabwareRunTimeCommand

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(getAddressableAreaNameFrom).mockReturnValue(ADDRESSABLE_AREA)
    vi.mocked(getClosestBeneathModuleId).mockReturnValue(MODULE_ID)
    vi.mocked(getClosestBeneathModuleModel).mockReturnValue(MODULE_MODEL)
    vi.mocked(getClosestBeneathAdapterId).mockReturnValue(ADAPTER_ID)
    vi.mocked(getLabwareDefURIFrom).mockReturnValue(LABWARE_URI)
    vi.mocked(getLwOffsetLocSeqFromLocSeq).mockReturnValue(
      OFFSET_LOCATION_SEQUENCE as any
    )
    vi.mocked(getLwModStackupDetails).mockReturnValue(
      LW_MOD_STACKUP_DETAILS as any
    )
  })

  it('should return null when result is null', () => {
    const commandWithNullResult = {
      ...MOCK_MOVE_COMMAND,
      result: null,
    }

    const result = getMoveLabwareLocationCombo(
      commandWithNullResult as any,
      MOCK_LW_URIS_BY_ID,
      MOCK_LABWARE,
      MOCK_MODULES
    )

    expect(result).toBeNull()
  })

  it('should return null when eventualDestinationLocationSequence is null', () => {
    const commandWithNullLocSeq = {
      ...MOCK_MOVE_COMMAND,
      result: {
        eventualDestinationLocationSequence: null,
      },
    }

    const result = getMoveLabwareLocationCombo(
      commandWithNullLocSeq as any,
      MOCK_LW_URIS_BY_ID,
      MOCK_LABWARE,
      MOCK_MODULES
    )

    expect(result).toBeNull()
  })

  it('should return null when addressableAreaName is null', () => {
    vi.mocked(getAddressableAreaNameFrom).mockReturnValue(null)

    const result = getMoveLabwareLocationCombo(
      MOCK_MOVE_COMMAND,
      MOCK_LW_URIS_BY_ID,
      MOCK_LABWARE,
      MOCK_MODULES
    )

    expect(result).toBeNull()
    expect(getAddressableAreaNameFrom).toHaveBeenCalledWith(LOCATION_SEQUENCE)
  })

  it('should return location combo when all required information is available', () => {
    const result = getMoveLabwareLocationCombo(
      MOCK_MOVE_COMMAND,
      MOCK_LW_URIS_BY_ID,
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

    expect(getAddressableAreaNameFrom).toHaveBeenCalledWith(LOCATION_SEQUENCE)
    expect(getClosestBeneathModuleId).toHaveBeenCalledWith(LOCATION_SEQUENCE)
    expect(getClosestBeneathModuleModel).toHaveBeenCalledWith(
      MODULE_ID,
      MOCK_MODULES
    )
    expect(getLabwareDefURIFrom).toHaveBeenCalledWith(
      LABWARE_ID,
      MOCK_LW_URIS_BY_ID
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

    const result = getMoveLabwareLocationCombo(
      MOCK_MOVE_COMMAND,
      MOCK_LW_URIS_BY_ID,
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

    const result = getMoveLabwareLocationCombo(
      MOCK_MOVE_COMMAND,
      MOCK_LW_URIS_BY_ID,
      MOCK_LABWARE,
      MOCK_MODULES
    )

    expect(result).not.toBeNull()
    expect(result?.closestBeneathAdapterId).toBeUndefined()
  })
})
