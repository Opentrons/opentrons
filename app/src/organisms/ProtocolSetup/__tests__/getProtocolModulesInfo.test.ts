import _protocolWithMagTempTC from '@opentrons/shared-data/protocol/fixtures/6/transferSettings.json'
import _protocolWithMultipleTemps from '@opentrons/shared-data/protocol/fixtures/6/multipleTempModules.json'
import _standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { getProtocolModulesInfo } from '../utils/getProtocolModulesInfo'
import { getModuleDef2, ProtocolAnalysisFile } from '@opentrons/shared-data'

const protocolWithMagTempTC = (_protocolWithMagTempTC as unknown) as ProtocolAnalysisFile
const protocolWithMultipleTemps = (_protocolWithMultipleTemps as unknown) as ProtocolAnalysisFile
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

    const MAG_LW_ID: keyof typeof _protocolWithMagTempTC.labware =
      'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
    const TEMP_LW_ID: keyof typeof _protocolWithMagTempTC.labware =
      'ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1'
    const TC_LW_ID: keyof typeof _protocolWithMagTempTC.labware =
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
            _protocolWithMagTempTC.labware[MAG_LW_ID]
              .definitionId as keyof typeof _protocolWithMagTempTC.labwareDefinitions
          ],
        nestedLabwareId: MAG_LW_ID,
        nestedLabwareDisplayName:
          _protocolWithMultipleTemps.labware[MAG_LW_ID].displayName,
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
            _protocolWithMagTempTC.labware[TEMP_LW_ID]
              .definitionId as keyof typeof _protocolWithMagTempTC.labwareDefinitions
          ],
        nestedLabwareId: TEMP_LW_ID,
        nestedLabwareDisplayName:
          _protocolWithMultipleTemps.labware[TEMP_LW_ID].displayName,
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
            _protocolWithMagTempTC.labware[TC_LW_ID]
              .definitionId as keyof typeof _protocolWithMagTempTC.labwareDefinitions
          ],
        nestedLabwareId: TC_LW_ID,
        nestedLabwareDisplayName:
          _protocolWithMultipleTemps.labware[TC_LW_ID].displayName,
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

    const MAG_LW_ID: keyof typeof _protocolWithMultipleTemps.labware =
      'aac5d680-3412-11eb-ad93-ed232a2337cf:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1'
    const TEMP_ONE_LW_ID: keyof typeof _protocolWithMultipleTemps.labware =
      'ada13110-3412-11eb-ad93-ed232a2337cf:opentrons/opentrons_96_aluminumblock_generic_pcr_strip_200ul/1'
    const TEMP_TWO_LW_ID: keyof typeof _protocolWithMultipleTemps.labware =
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
            _protocolWithMultipleTemps.labware[MAG_LW_ID]
              .definitionId as keyof typeof _protocolWithMultipleTemps.labwareDefinitions
          ],
        nestedLabwareId: MAG_LW_ID,
        nestedLabwareDisplayName:
          _protocolWithMultipleTemps.labware[MAG_LW_ID].displayName,
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
            _protocolWithMultipleTemps.labware[TEMP_ONE_LW_ID]
              .definitionId as keyof typeof _protocolWithMultipleTemps.labwareDefinitions
          ],
        nestedLabwareId: TEMP_ONE_LW_ID,
        nestedLabwareDisplayName:
          _protocolWithMultipleTemps.labware[TEMP_ONE_LW_ID].displayName,
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
            _protocolWithMultipleTemps.labware[TEMP_TWO_LW_ID]
              .definitionId as keyof typeof _protocolWithMultipleTemps.labwareDefinitions
          ],
        nestedLabwareId: TEMP_TWO_LW_ID,
        nestedLabwareDisplayName:
          _protocolWithMultipleTemps.labware[TEMP_TWO_LW_ID].displayName,
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
    const MAG_MOD_ID: keyof typeof _protocolWithMagTempTC.modules =
      '3e012450-3412-11eb-ad93-ed232a2337cf:magneticModuleType'
    const MAG_LW_ID: keyof typeof _protocolWithMagTempTC.labware =
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
            _protocolWithMagTempTC.labware[MAG_LW_ID]
              .definitionId as keyof typeof _protocolWithMagTempTC.labwareDefinitions
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
          modules: { [MAG_MOD_ID]: protocolWithMagTempTC.modules[MAG_MOD_ID] },
          labware: {
            [MAG_LW_ID]: {
              ...protocolWithMagTempTC.labware[MAG_LW_ID],
              displayName: stubDisplayName,
            },
          },
        },
        standardDeckDef
      )
    ).toEqual(expectedInfo)
  })
})
