import { getDisposalLabwareOptions } from '../selectors'
import fixture_tiprack_1000_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_trash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'

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
      trashId2: 'Trash',
      fixture_tiprack_1000_ul: 'Opentrons Tip Rack 1000 µL',
      fixture_tiprack_10_ul: 'Opentrons Tip Rack 10 µL',
    }
  })
  describe('getDisposalLabwareOptions', () => {
    it('returns an empty list when labware is NOT provided', () => {
      expect(getDisposalLabwareOptions.resultFunc([], names)).toEqual([])
    })
    it('returns empty list when trash is NOT present', () => {
      const labwareEntities = {
        ...tipracks,
      }
      expect(
        getDisposalLabwareOptions.resultFunc(labwareEntities, names)
      ).toEqual([])
    })
    it('filters out labware that is NOT trash when one trash bin present', () => {
      const labwareEntities = {
        ...tipracks,
        ...trash,
      }

      expect(
        getDisposalLabwareOptions.resultFunc(labwareEntities, names)
      ).toEqual([{ name: 'Trash', value: 'trashId' }])
    })
    it('filters out labware that is NOT trash when multiple trash bins present', () => {
      const trash2 = {
        trashId2: {
          def: { ...fixture_trash },
        },
      }
      const labwareEntities = {
        ...tipracks,
        ...trash,
        ...trash2,
      }

      expect(
        getDisposalLabwareOptions.resultFunc(labwareEntities, names)
      ).toEqual([
        { name: 'Trash', value: 'trashId' },
        { name: 'Trash', value: 'trashId2' },
      ])
    })
  })
})
