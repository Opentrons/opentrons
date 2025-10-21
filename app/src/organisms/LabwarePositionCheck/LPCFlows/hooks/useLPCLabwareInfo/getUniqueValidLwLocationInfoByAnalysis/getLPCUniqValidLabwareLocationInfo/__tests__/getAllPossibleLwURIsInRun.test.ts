import { beforeEach, describe, expect, it, vi } from 'vitest'

import { scanAllCommandsForAllLwUrisByLwId } from '../getAllPossibleLwURIsInRun'

import type {
  FlexStackerRetrieveRunTimeCommand,
  LoadedLabware,
  RunTimeCommand,
} from '@opentrons/shared-data'

describe('scanAllCommandsForAllLwUrisByLwId', () => {
  const LABWARE_ID_1 = 'labware-1'
  const LABWARE_URI_1 = 'labware-1'
  const LABWARE_ID_2 = 'labware-2'
  const LABWARE_URI_2 = 'labware-2'
  const ADAPTER_ID = 'adapter-1'
  const ADAPTER_URI = 'adapter-1'

  const MOCK_LOADED_LABWARE: LoadedLabware[] = [
    { id: LABWARE_ID_1, definitionUri: LABWARE_URI_1 },
  ] as LoadedLabware[]

  const MOCK_FLEX_STACKER_COMMAND: FlexStackerRetrieveRunTimeCommand = {
    commandType: 'flexStacker/retrieve',
    result: {
      labwareId: LABWARE_ID_2,
      primaryLabwareURI: LABWARE_URI_2,
      adapterId: ADAPTER_ID,
      adapterLabwareURI: ADAPTER_URI,
    },
  } as FlexStackerRetrieveRunTimeCommand

  const MOCK_OTHER_COMMAND: RunTimeCommand = {
    commandType: 'aspirate',
  } as RunTimeCommand

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should return labware URIs from loaded labware', () => {
    const result = scanAllCommandsForAllLwUrisByLwId(MOCK_LOADED_LABWARE, [])

    expect(result).toEqual({
      [LABWARE_ID_1]: LABWARE_URI_1,
    })
  })

  it('should include labware URIs from flexStacker/retrieve commands', () => {
    const result = scanAllCommandsForAllLwUrisByLwId(MOCK_LOADED_LABWARE, [
      MOCK_FLEX_STACKER_COMMAND,
    ])

    expect(result).toEqual({
      [LABWARE_ID_1]: LABWARE_URI_1,
      [LABWARE_ID_2]: LABWARE_URI_2,
      [ADAPTER_ID]: ADAPTER_URI,
    })
  })

  it('should ignore non-flexStacker/retrieve commands', () => {
    const result = scanAllCommandsForAllLwUrisByLwId(MOCK_LOADED_LABWARE, [
      MOCK_OTHER_COMMAND,
    ])

    expect(result).toEqual({
      [LABWARE_ID_1]: LABWARE_URI_1,
    })
  })

  it('should handle multiple commands', () => {
    const result = scanAllCommandsForAllLwUrisByLwId(MOCK_LOADED_LABWARE, [
      MOCK_FLEX_STACKER_COMMAND,
      MOCK_OTHER_COMMAND,
    ])

    expect(result).toEqual({
      [LABWARE_ID_1]: LABWARE_URI_1,
      [LABWARE_ID_2]: LABWARE_URI_2,
      [ADAPTER_ID]: ADAPTER_URI,
    })
  })

  it('should handle flexStacker/retrieve command without adapter', () => {
    const commandWithoutAdapter: FlexStackerRetrieveRunTimeCommand = {
      ...MOCK_FLEX_STACKER_COMMAND,
      result: {
        labwareId: LABWARE_ID_2,
        primaryLabwareURI: LABWARE_URI_2,
      },
    } as FlexStackerRetrieveRunTimeCommand

    const result = scanAllCommandsForAllLwUrisByLwId(MOCK_LOADED_LABWARE, [
      commandWithoutAdapter,
    ])

    expect(result).toEqual({
      [LABWARE_ID_1]: LABWARE_URI_1,
      [LABWARE_ID_2]: LABWARE_URI_2,
    })
  })

  it('should handle flexStacker/retrieve command with null result', () => {
    const commandWithNullResult: FlexStackerRetrieveRunTimeCommand = {
      ...MOCK_FLEX_STACKER_COMMAND,
      result: null,
    } as any

    const result = scanAllCommandsForAllLwUrisByLwId(MOCK_LOADED_LABWARE, [
      commandWithNullResult,
    ])

    expect(result).toEqual({
      [LABWARE_ID_1]: LABWARE_URI_1,
      '': '',
    })
    expect(console.error).toHaveBeenCalled()
  })

  it('should handle empty loaded labware and commands', () => {
    const result = scanAllCommandsForAllLwUrisByLwId([], [])

    expect(result).toEqual({})
  })
})
