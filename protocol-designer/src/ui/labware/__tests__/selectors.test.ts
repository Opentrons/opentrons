import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import { SPAN7_8_10_11_SLOT, FIXED_TRASH_ID } from '../../../constants'
import {
  getDisposalLabwareOptions,
  getLabwareOptions,
  _sortLabwareDropdownOptions,
} from '../selectors'
import { LabwareEntities } from '../../../../../step-generation/src/types'
import { LabwareDefinition2 } from '../../../../../shared-data/lib/js/types.d'
import _fixture_tiprack_1000_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_1000_ul.json'
import _fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import _fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import _fixture_trash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'

const fixtureTiprack1000ul = _fixture_tiprack_1000_ul as LabwareDefinition2
const fixtureTiprack10ul = _fixture_tiprack_10_ul as LabwareDefinition2
const fixture96Plate = _fixture_96_plate as LabwareDefinition2
const fixtureTrash = _fixture_trash as LabwareDefinition2

describe('labware selectors', () => {
  let names: Record<string, string>
  let tipracks: LabwareEntities
  let trash: LabwareEntities
  let otherLabware: LabwareEntities

  beforeEach(() => {
    trash = {
      // @ts-expect-error(sa, 2021-6-15): missing id and labwareDefURI
      trashId: {
        def: { ...fixtureTrash },
      },
    }

    tipracks = {
      // @ts-expect-error(sa, 2021-6-15): missing labwareDefURI
      tiprack100Id: {
        id: 'tiprack100Id',
        def: { ...fixtureTiprack1000ul },
      },
      // @ts-expect-error(sa, 2021-6-15): missing labwareDefURI
      tiprack10Id: {
        id: 'tiprack10Id',
        def: { ...fixtureTiprack10ul },
      },
    }

    otherLabware = {
      // @ts-expect-error(sa, 2021-6-15): missing labwareDefURI
      wellPlateId: {
        id: 'wellPlateId',
        def: { ...fixture96Plate },
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
        // @ts-expect-error(sa, 2021-6-15): resultFunc
        getDisposalLabwareOptions.resultFunc([], names)
      ).toEqual([])
    })
    it('returns empty list when trash is NOT present', () => {
      const labwareEntities = {
        ...tipracks,
      }
      expect(
        // @ts-expect-error(sa, 2021-6-15): resultFunc
        getDisposalLabwareOptions.resultFunc(labwareEntities, names)
      ).toEqual([])
    })
    it('filters out labware that is NOT trash when one trash bin present', () => {
      const labwareEntities = {
        ...tipracks,
        ...trash,
      }

      expect(
        // @ts-expect-error(sa, 2021-6-15): resultFunc
        getDisposalLabwareOptions.resultFunc(labwareEntities, names)
      ).toEqual([{ name: 'Trash', value: 'trashId' }])
    })
    it('filters out labware that is NOT trash when multiple trash bins present', () => {
      const trash2 = {
        trashId2: {
          def: { ...fixtureTrash },
        },
      }
      const labwareEntities = {
        ...tipracks,
        ...trash,
        ...trash2,
      }

      expect(
        // @ts-expect-error(sa, 2021-6-15): resultFunc
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
        // @ts-expect-error(sa, 2021-6-15): resultFunc
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
        // @ts-expect-error(sa, 2021-6-15): resultFunc
        getLabwareOptions.resultFunc(labwareEntities, names, initialDeckSetup)
      ).toEqual([
        { name: 'Source Plate', value: 'wellPlateId' },
        { name: 'Trash', value: 'trashId' },
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

      const nicknames: Record<string, string> = {
        ...names,
        wellPlateId: 'Well Plate',
        tempPlateId: 'Temp Plate',
        tcPlateId: 'TC Plate',
      }

      expect(
        // @ts-expect-error(sa, 2021-6-15): resultFunc
        getLabwareOptions.resultFunc(
          labwareEntities,
          nicknames,
          initialDeckSetup
        )
      ).toEqual([
        { name: 'MAG Well Plate', value: 'wellPlateId' },
        { name: 'TEMP Temp Plate', value: 'tempPlateId' },
        { name: 'THERMO TC Plate', value: 'tcPlateId' },
        { name: 'Trash', value: 'trashId' },
      ])
    })
  })

  describe('_sortLabwareDropdownOptions', () => {
    const trashOption = {
      name: 'Some kinda fixed trash',
      value: FIXED_TRASH_ID,
    }
    const zzzPlateOption = { name: 'Zzz Plate', value: 'zzz' }
    const aaaPlateOption = { name: 'Aaa Plate', value: 'aaa' }
    it('should sort labware ids in alphabetical order but with fixed trash at the bottom', () => {
      const result = _sortLabwareDropdownOptions([
        trashOption,
        aaaPlateOption,
        zzzPlateOption,
      ])
      expect(result).toEqual([aaaPlateOption, zzzPlateOption, trashOption])
    })

    it('should handle {} case', () => {
      const result = _sortLabwareDropdownOptions([])
      expect(result).toEqual([])
    })

    it('should handle case w/o non-trash labware', () => {
      const result = _sortLabwareDropdownOptions([trashOption])
      expect(result).toEqual([trashOption])
    })
  })
})
