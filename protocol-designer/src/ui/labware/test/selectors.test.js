import { getDisposalLabwareOptions } from '../selectors'
import fixture_tiprack_1000_ul from '../../../../../shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import fixture_tiprack_10_ul from '../../../../../shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_trash from '../../../../../shared-data/labware/fixtures/2/fixture_trash.json'

jest.mock('../../../labware-defs/utils')
describe('labware selectors', () => {
  let names
  let tipracks
  let trash

  beforeEach(() => {
    trash = {
      trashId: {
        def: { ...fixture_trash },
      },
    }

    tipracks = {
      fixture_tiprack_1000_ul: {
        id: 'fixture_tiprack_1000_ul',
        def: { ...fixture_tiprack_1000_ul },
      },
      fixture_tiprack_10_ul: {
        id: 'fixture_tiprack_10_ul',
        def: { ...fixture_tiprack_10_ul },
      },
    }

    names = {
      trashId: 'Trash',
      fixture_tiprack_1000_ul: 'Opentrons Tip Rack 1000 µL',
      fixture_tiprack_10_ul: 'Opentrons Tip Rack 10 µL',
    }
  })
  describe('getDisposalLabwareOptions', () => {
    test('returns an empty list when no labware is provided', () => {
      expect(getDisposalLabwareOptions.resultFunc([], names)).toEqual([])
    })
    test('returns empty list when trash is NOT present', () => {
      const labwareEntities = {
        ...tipracks,
      }
      expect(
        getDisposalLabwareOptions.resultFunc(labwareEntities, names)
      ).toEqual([])
    })
    test('filters out labware that is not trash', () => {
      const labwareEntities = {
        ...tipracks,
        ...trash,
      }

      expect(
        getDisposalLabwareOptions.resultFunc(labwareEntities, names)
      ).toEqual([{ name: 'Trash', value: 'trashId' }])
    })
  })
})
