import { FLEX_TRASH_DEF_URI } from '../../../../constants'
import { getUnusedTrash } from '../getUnusedTrash'
import type { CreateCommand } from '@opentrons/shared-data'
import type { InitialDeckSetup } from '../../../../step-forms'

describe('getUnusedTrash', () => {
  it('returns true for unused trash bin', () => {
    const labwareId = 'mockLabwareId'
    const mockTrash = ({
      [labwareId]: { labwareDefURI: FLEX_TRASH_DEF_URI, id: labwareId },
    } as unknown) as InitialDeckSetup['labware']

    expect(getUnusedTrash(mockTrash, [])).toEqual({
      trashBinUnused: true,
      wasteChuteUnused: false,
    })
  })
  it('returns false for unused trash bin', () => {
    const labwareId = 'mockLabwareId'
    const mockTrash = ({
      [labwareId]: { labwareDefURI: FLEX_TRASH_DEF_URI, id: labwareId },
    } as unknown) as InitialDeckSetup['labware']
    const mockCommand = ([
      {
        labwareId: {
          commandType: 'dropTip',
          params: { labwareId: labwareId },
        },
      },
    ] as unknown) as CreateCommand[]

    expect(getUnusedTrash(mockTrash, mockCommand)).toEqual({
      trashBinUnused: true,
      wasteChuteUnused: false,
    })
  })
  //    TODO(jr, 10/30/23): add test coverage for waste chute
})
