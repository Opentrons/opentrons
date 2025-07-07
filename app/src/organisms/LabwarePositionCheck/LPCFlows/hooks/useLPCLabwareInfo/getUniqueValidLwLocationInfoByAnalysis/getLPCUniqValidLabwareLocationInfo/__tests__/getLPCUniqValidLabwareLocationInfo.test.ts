import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getLPCUniqValidLabwareLocationInfo } from '..'
import { appendUniqValidLocCombo } from '../appendUniqValidLocCombo'
import { scanAllCommandsForAllLwUrisByLwId } from '../getAllPossibleLwURIsInRun'
import { getLoadLabwareLocationCombo } from '../getLoadLabwareLocationCombo'
import { getMoveLabwareLocationCombo } from '../getMoveLabwareLocationCombo'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { LabwareLocationInfoWithLocSeq } from '..'

vi.mock('../appendUniqValidLocCombo')
vi.mock('../getLoadLabwareLocationCombo')
vi.mock('../getMoveLabwareLocationCombo')
vi.mock('../getAllPossibleLwURIsInRun')

describe('getLPCUniqValidLabwareLocationInfo', () => {
  const LABWARE_ID_1 = 'labware-1'
  const LABWARE_ID_2 = 'labware-2'
  const LABWARE_URI_1 = 'opentrons/labware-1'
  const LABWARE_URI_2 = 'opentrons/labware-2'

  const MOCK_LABWARE = [
    { id: LABWARE_ID_1, definitionUri: LABWARE_URI_1 },
    { id: LABWARE_ID_2, definitionUri: LABWARE_URI_2 },
  ]

  const MOCK_MODULES = [{ id: 'module-1', model: 'thermocyclerModuleV2' }]

  const MOCK_LOAD_COMMAND = {
    commandType: 'loadLabware',
    params: { labwareId: LABWARE_ID_1 },
  }

  const MOCK_MOVE_COMMAND = {
    commandType: 'moveLabware',
    params: { labwareId: LABWARE_ID_2 },
  }

  const MOCK_OTHER_COMMAND = {
    commandType: 'aspirate',
    params: {},
  }

  const MOCK_COMMANDS = [
    MOCK_LOAD_COMMAND,
    MOCK_MOVE_COMMAND,
    MOCK_OTHER_COMMAND,
  ]

  const MOCK_PROTOCOL_DATA: CompletedProtocolAnalysis = {
    labware: MOCK_LABWARE,
    modules: MOCK_MODULES,
    commands: MOCK_COMMANDS,
  } as any

  const MOCK_LABWARE_DEFS = [
    { metadata: { displayName: 'Labware 1' } },
    { metadata: { displayName: 'Labware 2' } },
  ] as any

  const MOCK_LW_ID_URI_INFO = {
    [LABWARE_ID_1]: LABWARE_URI_1,
    [LABWARE_ID_2]: LABWARE_URI_2,
  }

  const MOCK_LOAD_COMBO: LabwareLocationInfoWithLocSeq = {
    definitionUri: LABWARE_URI_1,
    labwareId: LABWARE_ID_1,
    addressableAreaName: 'A1',
    lwOffsetLocSeq: [],
    lwModOnlyStackupDetails: [],
    locationSequence: [],
  }

  const MOCK_MOVE_COMBO: LabwareLocationInfoWithLocSeq = {
    definitionUri: LABWARE_URI_2,
    labwareId: LABWARE_ID_2,
    addressableAreaName: 'B1',
    lwOffsetLocSeq: [],
    lwModOnlyStackupDetails: [],
    locationSequence: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(scanAllCommandsForAllLwUrisByLwId).mockReturnValue(
      MOCK_LW_ID_URI_INFO
    )
    vi.mocked(getLoadLabwareLocationCombo).mockReturnValue(MOCK_LOAD_COMBO)
    vi.mocked(getMoveLabwareLocationCombo).mockReturnValue(MOCK_MOVE_COMBO)
    vi.mocked(appendUniqValidLocCombo).mockImplementation(
      (acc, defs, combo) => {
        if (combo) {
          return [...acc, combo]
        }
        return acc
      }
    )
  })

  it('should return empty array when protocolData is null', () => {
    const result = getLPCUniqValidLabwareLocationInfo(null, MOCK_LABWARE_DEFS)

    expect(result).toEqual([])
    expect(scanAllCommandsForAllLwUrisByLwId).toHaveBeenCalledWith([], [])
  })

  it('should process each command and append valid combos', () => {
    const result = getLPCUniqValidLabwareLocationInfo(
      MOCK_PROTOCOL_DATA,
      MOCK_LABWARE_DEFS
    )

    expect(scanAllCommandsForAllLwUrisByLwId).toHaveBeenCalledWith(
      MOCK_LABWARE,
      MOCK_COMMANDS
    )
    expect(getLoadLabwareLocationCombo).toHaveBeenCalledWith(
      MOCK_LOAD_COMMAND,
      MOCK_LABWARE,
      MOCK_MODULES
    )
    expect(getMoveLabwareLocationCombo).toHaveBeenCalledWith(
      MOCK_MOVE_COMMAND,
      MOCK_LW_ID_URI_INFO,
      MOCK_LABWARE,
      MOCK_MODULES
    )

    expect(appendUniqValidLocCombo).toHaveBeenCalledTimes(3)
    expect(appendUniqValidLocCombo).toHaveBeenCalledWith(
      [],
      MOCK_LABWARE_DEFS,
      MOCK_LOAD_COMBO
    )
    expect(appendUniqValidLocCombo).toHaveBeenCalledWith(
      [MOCK_LOAD_COMBO],
      MOCK_LABWARE_DEFS,
      MOCK_MOVE_COMBO
    )
    expect(appendUniqValidLocCombo).toHaveBeenCalledWith(
      [MOCK_LOAD_COMBO, MOCK_MOVE_COMBO],
      MOCK_LABWARE_DEFS,
      null
    )

    expect(result).toEqual([
      {
        definitionUri: LABWARE_URI_1,
        labwareId: LABWARE_ID_1,
        addressableAreaName: 'A1',
        lwOffsetLocSeq: [],
        lwModOnlyStackupDetails: [],
      },
      {
        definitionUri: LABWARE_URI_2,
        labwareId: LABWARE_ID_2,
        addressableAreaName: 'B1',
        lwOffsetLocSeq: [],
        lwModOnlyStackupDetails: [],
      },
    ])
  })

  it('should handle empty commands array', () => {
    const emptyCommandsProtocolData = {
      ...MOCK_PROTOCOL_DATA,
      commands: [],
    }

    const result = getLPCUniqValidLabwareLocationInfo(
      emptyCommandsProtocolData,
      MOCK_LABWARE_DEFS
    )

    expect(result).toEqual([])
    expect(scanAllCommandsForAllLwUrisByLwId).toHaveBeenCalledWith(
      MOCK_LABWARE,
      []
    )
    expect(appendUniqValidLocCombo).not.toHaveBeenCalled()
  })

  it('should skip commands that do not generate location combos', () => {
    vi.mocked(getLoadLabwareLocationCombo).mockReturnValue(null)
    vi.mocked(getMoveLabwareLocationCombo).mockReturnValue(null)

    const result = getLPCUniqValidLabwareLocationInfo(
      MOCK_PROTOCOL_DATA,
      MOCK_LABWARE_DEFS
    )

    expect(result).toEqual([])
    expect(appendUniqValidLocCombo).toHaveBeenCalledTimes(3)
    expect(appendUniqValidLocCombo).toHaveBeenCalledWith(
      [],
      MOCK_LABWARE_DEFS,
      null
    )
    expect(appendUniqValidLocCombo).toHaveBeenCalledWith(
      [],
      MOCK_LABWARE_DEFS,
      null
    )
    expect(appendUniqValidLocCombo).toHaveBeenCalledWith(
      [],
      MOCK_LABWARE_DEFS,
      null
    )
  })
})
