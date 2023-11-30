import _protocolWithMagTempTC from '@opentrons/shared-data/protocol/fixtures/6/transferSettings.json'
import _protocolWithMultipleTemps from '@opentrons/shared-data/protocol/fixtures/6/multipleTempModules.json'
import _standardDeckDef from '@opentrons/shared-data/deck/definitions/4/ot2_standard.json'
import { getProtocolModulesInfo } from '../getProtocolModulesInfo'
import {
  getModuleDef2,
  ProtocolAnalysisOutput,
  LoadedLabware,
  LoadedModule,
} from '@opentrons/shared-data'

const protocolWithMagTempTC = ({
  ..._protocolWithMagTempTC,
  labware: [
    {
      id: 'fixedTrash',
      displayName: 'Trash',
      definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
    },
    {
      id:
        '3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1',
      displayName: 'Opentrons 96 Tip Rack 1000 µL',
      definitionUri: 'opentrons/opentrons_96_tiprack_1000ul/1',
    },
    {
      id:
        '5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/1',
      displayName: 'NEST 1 Well Reservoir 195 mL',
      definitionUri: 'opentrons/nest_1_reservoir_195ml/1',
    },
    {
      id:
        '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      displayName: 'Corning 24 Well Plate 3.4 mL Flat',
      definitionUri: 'opentrons/corning_24_wellplate_3.4ml_flat/1',
    },
    {
      id:
        'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
      definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
    },
    {
      id:
        'ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1',
      displayName:
        'Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 µL',
      definitionUri:
        'opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1',
    },
    {
      id:
        'b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt (1)',
      definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
    },
    {
      id:
        'faa13a50-a9bf-11eb-bce6-9f1d5b9c1a1b:opentrons/opentrons_96_tiprack_20ul/1',
      displayName: 'Opentrons 96 Tip Rack 20 µL',
      definitionUri: 'opentrons/opentrons_96_tiprack_20ul/1',
    },
    {
      id: '53d3b350-a9c0-11eb-bce6-9f1d5b9c1a1b',
      displayName: 'Corning 24 Well Plate 3.4 mL Flat (1)',
      definitionUri: 'opentrons/corning_24_wellplate_3.4ml_flat/1',
    },
  ],
  modules: [
    {
      id: '3e012450-3412-11eb-ad93-ed232a2337cf:magneticModuleType',
      model: 'magneticModuleV2',
      location: {
        slotName: '1',
      },
    },
    {
      id: '3e0283e0-3412-11eb-ad93-ed232a2337cf:temperatureModuleType',
      model: 'temperatureModuleV2',
      location: {
        slotName: '3',
      },
    },
    {
      id: '3e039550-3412-11eb-ad93-ed232a2337cf:thermocyclerModuleType',
      model: 'thermocyclerModuleV1',
      location: {
        slotName: '7',
      },
    },
  ] as LoadedModule[],
} as unknown) as ProtocolAnalysisOutput
const protocolWithMultipleTemps = ({
  ..._protocolWithMultipleTemps,
  labware: [
    {
      id: 'fixedTrash',
      displayName: 'Trash',
      definitionUri: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
    },
    {
      id:
        '3e047fb0-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_tiprack_1000ul/1',
      displayName: 'Opentrons 96 Tip Rack 1000 µL',
      definitionUri: 'opentrons/opentrons_96_tiprack_1000ul/1',
    },
    {
      id:
        '5ae317e0-3412-11eb-ad93-ed232a2337cf:opentrons/nest_1_reservoir_195ml/1',
      displayName: 'NEST 1 Well Reservoir 195 mL',
      definitionUri: 'opentrons/nest_1_reservoir_195ml/1',
    },
    {
      id:
        '60e8b050-3412-11eb-ad93-ed232a2337cf:opentrons/corning_24_wellplate_3.4ml_flat/1',
      displayName: 'Corning 24 Well Plate 3.4 mL Flat',
      definitionUri: 'opentrons/corning_24_wellplate_3.4ml_flat/1',
    },
    {
      id:
        'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
      definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
    },
    {
      id:
        'ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1',
      displayName:
        'Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 µL',
      definitionUri:
        'opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1',
    },
    {
      id:
        'b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt (1)',
      definitionUri: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
    },
    {
      id:
        'faa13a50-a9bf-11eb-bce6-9f1d5b9c1a1b:opentrons/opentrons_96_tiprack_20ul/1',
      displayName: 'Opentrons 96 Tip Rack 20 µL',
      definitionUri: 'opentrons/opentrons_96_tiprack_20ul/1',
    },
    {
      id: '53d3b350-a9c0-11eb-bce6-9f1d5b9c1a1b',
      displayName: 'Corning 24 Well Plate 3.4 mL Flat (1)',
      definitionUri: 'opentrons/corning_24_wellplate_3.4ml_flat/1',
    },
  ],
  modules: [
    {
      id: '3e012450-3412-11eb-ad93-ed232a2337cf:magneticModuleType',
      model: 'magneticModuleV2',
      location: {
        slotName: '1',
      },
    },
    {
      id: '3e0283e0-3412-11eb-ad93-ed232a2337cf:temperatureModuleType1',
      model: 'temperatureModuleV2',
      location: {
        slotName: '3',
      },
    },
    {
      id: '3e039550-3412-11eb-ad93-ed232a2337cf:temperatureModuleType2',
      model: 'temperatureModuleV2',
      location: {
        slotName: '7',
      },
    },
  ] as LoadedModule[],
} as unknown) as ProtocolAnalysisOutput
const standardDeckDef = _standardDeckDef as any

describe('getProtocolModulesInfo', () => {
  it('should gather protocol module info for temp, mag, and tc', () => {
    // mag mod is in deck slot 1 which has [x,y] coordinate [0,0,0]
    const SLOT_1_COORDS = [0, 0, 0]
    // temp mod is in deck slot 3 which has [x,y] coordinate [265,0,0]
    const SLOT_3_COORDS = [265, 0, 0]
    // TC takes up rests in slot 7 which has [x,y] coordinate [0,181,0]
    const SLOT_7_COORDS = [0, 181, 0]
    // these ids come from the protocol fixture
    const MAG_MOD_ID: keyof typeof _protocolWithMagTempTC.modules =
      '3e012450-3412-11eb-ad93-ed232a2337cf:magneticModuleType'
    const TEMP_MOD_ID: keyof typeof _protocolWithMagTempTC.modules =
      '3e0283e0-3412-11eb-ad93-ed232a2337cf:temperatureModuleType'
    const TC_ID: keyof typeof _protocolWithMagTempTC.modules =
      '3e039550-3412-11eb-ad93-ed232a2337cf:thermocyclerModuleType'

    const MAG_LW_ID =
      'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
    const TEMP_LW_ID =
      'ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1'
    const TC_LW_ID =
      'b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'

    const expectedInfo = [
      {
        moduleId: MAG_MOD_ID,
        x: SLOT_1_COORDS[0],
        y: SLOT_1_COORDS[1],
        z: SLOT_1_COORDS[2],
        moduleDef: getModuleDef2('magneticModuleV2'),
        nestedLabwareDef:
          _protocolWithMagTempTC.labwareDefinitions[
            'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
          ],
        nestedLabwareId: MAG_LW_ID,
        nestedLabwareDisplayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
        protocolLoadOrder: 0,
        slotName: '1',
      },
      {
        moduleId: TEMP_MOD_ID,
        x: SLOT_3_COORDS[0],
        y: SLOT_3_COORDS[1],
        z: SLOT_3_COORDS[2],
        moduleDef: getModuleDef2('temperatureModuleV2'),
        nestedLabwareDef:
          _protocolWithMagTempTC.labwareDefinitions[
            'opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1'
          ],
        nestedLabwareId: TEMP_LW_ID,
        nestedLabwareDisplayName:
          'Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 µL',
        protocolLoadOrder: 1,
        slotName: '3',
      },
      {
        moduleId: TC_ID,
        x: SLOT_7_COORDS[0],
        y: SLOT_7_COORDS[1],
        z: SLOT_7_COORDS[2],
        moduleDef: getModuleDef2('thermocyclerModuleV1'),
        nestedLabwareDef:
          _protocolWithMagTempTC.labwareDefinitions[
            'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
          ],
        nestedLabwareId: TC_LW_ID,
        nestedLabwareDisplayName:
          'NEST 96 Well Plate 100 µL PCR Full Skirt (1)',
        protocolLoadOrder: 2,
        slotName: '7',
      },
    ]

    expect(
      getProtocolModulesInfo(protocolWithMagTempTC, standardDeckDef)
    ).toEqual(expectedInfo)
  })
  it('should gather protocol module info for mag, and two temps', () => {
    // mag mod is in deck slot 1 which has [x,y] coordinate [0,0,0]
    const SLOT_1_COORDS = [0, 0, 0]
    // temp mod is in deck slot 3 which has [x,y] coordinate [265,0,0]
    const SLOT_3_COORDS = [265, 0, 0]
    // TC takes up rests in slot 7 which has [x,y] coordinate [0,181,0]
    const SLOT_7_COORDS = [0, 181, 0]
    // these ids come from the protocol fixture
    const MAG_MOD_ID: keyof typeof _protocolWithMultipleTemps.modules =
      '3e012450-3412-11eb-ad93-ed232a2337cf:magneticModuleType'
    const TEMP_MOD_ONE_ID: keyof typeof _protocolWithMultipleTemps.modules =
      '3e0283e0-3412-11eb-ad93-ed232a2337cf:temperatureModuleType1'
    const TEMP_MOD_TWO_ID: keyof typeof _protocolWithMultipleTemps.modules =
      '3e039550-3412-11eb-ad93-ed232a2337cf:temperatureModuleType2'

    const MAG_LW_ID =
      'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
    const TEMP_ONE_LW_ID =
      'ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1'
    const TEMP_TWO_LW_ID =
      'b0103540-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'

    const expectedInfo = [
      {
        moduleId: MAG_MOD_ID,
        x: SLOT_1_COORDS[0],
        y: SLOT_1_COORDS[1],
        z: SLOT_1_COORDS[2],
        moduleDef: getModuleDef2('magneticModuleV2'),
        nestedLabwareDef:
          _protocolWithMultipleTemps.labwareDefinitions[
            'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
          ],
        nestedLabwareId: MAG_LW_ID,
        nestedLabwareDisplayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
        protocolLoadOrder: 0,
        slotName: '1',
      },
      {
        moduleId: TEMP_MOD_ONE_ID,
        x: SLOT_3_COORDS[0],
        y: SLOT_3_COORDS[1],
        z: SLOT_3_COORDS[2],
        moduleDef: getModuleDef2('temperatureModuleV2'),
        nestedLabwareDef:
          _protocolWithMultipleTemps.labwareDefinitions[
            'opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1'
          ],
        nestedLabwareId: TEMP_ONE_LW_ID,
        nestedLabwareDisplayName:
          'Opentrons 96 Well Aluminum Block with Generic PCR Strip 200 µL',
        protocolLoadOrder: 1,
        slotName: '3',
      },
      {
        moduleId: TEMP_MOD_TWO_ID,
        x: SLOT_7_COORDS[0],
        y: SLOT_7_COORDS[1],
        z: SLOT_7_COORDS[2],
        moduleDef: getModuleDef2('temperatureModuleV2'),
        nestedLabwareDef:
          _protocolWithMultipleTemps.labwareDefinitions[
            'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
          ],
        nestedLabwareId: TEMP_TWO_LW_ID,
        nestedLabwareDisplayName:
          'NEST 96 Well Plate 100 µL PCR Full Skirt (1)',
        protocolLoadOrder: 2,
        slotName: '7',
      },
    ]

    expect(
      getProtocolModulesInfo(protocolWithMultipleTemps, standardDeckDef)
    ).toEqual(expectedInfo)
  })

  it('should include nested Labware display name if present', () => {
    // mag mod is in deck slot 1 which has [x,y] coordinate [0,0,0]
    const SLOT_1_COORDS = [0, 0, 0]
    // these ids come from the protocol fixture
    const MAG_MOD_ID = '3e012450-3412-11eb-ad93-ed232a2337cf:magneticModuleType'
    const MAG_LW_ID =
      'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
    const stubDisplayName = 'custom display name'

    const expectedInfo = [
      {
        moduleId: MAG_MOD_ID,
        x: SLOT_1_COORDS[0],
        y: SLOT_1_COORDS[1],
        z: SLOT_1_COORDS[2],
        moduleDef: getModuleDef2('magneticModuleV2'),
        nestedLabwareDef:
          _protocolWithMagTempTC.labwareDefinitions[
            'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
          ],
        nestedLabwareId: MAG_LW_ID,
        nestedLabwareDisplayName: stubDisplayName,
        protocolLoadOrder: 0,
        slotName: '1',
      },
    ]

    expect(
      getProtocolModulesInfo(
        {
          ...protocolWithMagTempTC,
          modules: [
            { id: MAG_MOD_ID, model: 'magneticModuleV2' },
          ] as LoadedModule[],
          labware: [
            {
              definitionUri:
                'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
              id: MAG_LW_ID,
              displayName: stubDisplayName,
            } as LoadedLabware,
          ],
        },
        standardDeckDef
      )
    ).toEqual(expectedInfo)
  })
})
