// @flow
import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import { SPAN7_8_10_11_SLOT } from '../../../constants'
import { getDisposalLabwareOptions, getLabwareOptions } from '../selectors'
import fixture_tiprack_1000_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_trash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'

describe('labware selectors', () => {
  let names
  let tipracks
  let trash
  let otherLabware

  beforeEach(() => {
    trash = {
      trashId: {
        def: { ...fixture_trash },
      },
    }

    tipracks = {
      tiprack100Id: {
        id: 'tiprack100Id',
        def: { ...fixture_tiprack_1000_ul },
      },
      tiprack10Id: {
        id: 'tiprack10Id',
        def: { ...fixture_tiprack_10_ul },
      },
    }

    otherLabware = {
      wellPlateId: {
        id: 'wellPlateId',
        def: { ...fixture_96_plate },
      },
    }

    names = {
      trashId: 'Trash',
      trashId2: 'Trash',

      tiprack100Id: 'Opentrons Tip Rack 1000 µL',
      tiprack10Id: 'Opentrons Tip Rack 10 µL',

      wellPlateId: 'Source Plate',
    }
  })

  describe('getDisposalLabwareOptions', () => {
    it('returns an empty list when labware is NOT provided', () => {
      expect(
        // $FlowFixMe(IL, 2020-03-12): resultFunc
        getDisposalLabwareOptions.resultFunc([], names)
      ).toEqual([])
    })
    it('returns empty list when trash is NOT present', () => {
      const labwareEntities = {
        ...tipracks,
      }
      expect(
        // $FlowFixMe(IL, 2020-03-12): resultFunc
        getDisposalLabwareOptions.resultFunc(labwareEntities, names)
      ).toEqual([])
    })
    it('filters out labware that is NOT trash when one trash bin present', () => {
      const labwareEntities = {
        ...tipracks,
        ...trash,
      }

      expect(
        // $FlowFixMe(IL, 2020-03-12): resultFunc
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
        // $FlowFixMe(IL, 2020-03-12): resultFunc
        getDisposalLabwareOptions.resultFunc(labwareEntities, names)
      ).toEqual([
        { name: 'Trash', value: 'trashId' },
        { name: 'Trash', value: 'trashId2' },
      ])
    })
  })

  describe('getLabwareOptions', () => {
    it('should return an empty list when no labware is present', () => {
      expect(
        // $FlowFixMe(IL, 2020-03-12): resultFunc
        getDisposalLabwareOptions.resultFunc(
          {},
          {},
          { labware: {}, modules: {}, pipettes: {} }
        )
      ).toEqual([])
    })

    it('should return labware options when no modules are present, with no tipracks', () => {
      const labwareEntities = {
        ...tipracks,
        ...trash,
        ...otherLabware,
      }
      const initialDeckSetup = {
        labware: labwareEntities,
        modules: {},
        pipettes: {},
      }
      expect(
        // $FlowFixMe(IL, 2020-03-12): resultFunc
        getLabwareOptions.resultFunc(labwareEntities, names, initialDeckSetup)
      ).toEqual([
        { name: 'Trash', value: 'trashId' },
        { name: 'Source Plate', value: 'wellPlateId' },
      ])
    })

    it('should return labware options with module prefixes when a labware is on module', () => {
      const labware = {
        wellPlateId: {
          ...otherLabware.wellPlateId,
          slot: 'magModuleId', // On magnetic module
        },
        tempPlateId: {
          ...otherLabware.wellPlateId,
          id: 'tempPlateId',
          slot: 'tempModuleId', // On temperature module
        },
        tcPlateId: {
          ...otherLabware.wellPlateId,
          id: 'tcPlateId',
          slot: 'thermocyclerId', // On thermocycler
        },
      }
      const labwareEntities = { ...trash, ...labware }
      const initialDeckSetup = {
        pipettes: {},
        labware: {
          ...trash,
          ...labware,
        },
        modules: {
          magModuleId: {
            id: 'magModuleId',
            type: MAGNETIC_MODULE_TYPE,
            model: MAGNETIC_MODULE_V1,
            slot: '1',
          },
          tempModuleId: {
            id: 'tempModuleId',
            type: TEMPERATURE_MODULE_TYPE,
            model: TEMPERATURE_MODULE_V1,
            slot: '3',
          },
          thermocyclerId: {
            id: 'thermocyclerId',
            type: THERMOCYCLER_MODULE_TYPE,
            model: THERMOCYCLER_MODULE_V1,
            slot: SPAN7_8_10_11_SLOT,
          },
        },
      }

      const nicknames: { [string]: string } = {
        ...names,
        wellPlateId: 'Well Plate',
        tempPlateId: 'Temp Plate',
        tcPlateId: 'TC Plate',
      }

      expect(
        // $FlowFixMe(IL, 2020-03-12): resultFunc
        getLabwareOptions.resultFunc(
          labwareEntities,
          nicknames,
          initialDeckSetup
        )
      ).toEqual([
        { name: 'Trash', value: 'trashId' },
        { name: 'MAG Well Plate', value: 'wellPlateId' },
        { name: 'TEMP Temp Plate', value: 'tempPlateId' },
        { name: 'THERMO TC Plate', value: 'tcPlateId' },
      ])
    })
  })
})
