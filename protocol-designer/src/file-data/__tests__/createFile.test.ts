import Ajv from 'ajv'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  commandSchemaV8,
  fixtureP10SingleV2Specs,
  fixtureP300SingleV2Specs,
  labwareSchemaV2,
  OT2_ROBOT_TYPE,
} from '@opentrons/shared-data'
import {
  fixture_12_trough,
  fixture_96_plate,
  fixture_tiprack_10_ul,
  fixture_tiprack_300_ul,
} from '@opentrons/shared-data/labware/fixtures/2'
import { formatPyStr, PAPI_VERSION } from '@opentrons/step-generation'

import {
  dismissedWarnings,
  fileMetadata,
  ingredients,
  ingredLocations,
  labwareEntities,
  labwareNicknamesById,
  pipetteEntities,
} from '../__fixtures__/createFile/commonFields'
import * as v7Fixture from '../__fixtures__/createFile/v7Fixture'
import { getLoadLiquidCommands } from '../../load-file/migration/utils/getLoadLiquidCommands'
import { createFile, getLabwareDefinitionsInUse } from '../selectors'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  InvariantContext,
  LabwareEntities,
  PipetteEntities,
} from '../../../../step-generation/src/types'
import type { LabwareDefByDefURI } from '../../labware-defs'

vi.mock('../../load-file/migration/utils/getLoadLiquidCommands')

const ajv = new Ajv({
  allErrors: true,
  jsonPointers: true,
})
// v3 and v4 protocol schema contain reference to v2 labware schema, so give AJV access to it
// and add v8 command schema
ajv.addSchema(labwareSchemaV2)
ajv.addSchema(commandSchemaV8)

describe('createFile selector', () => {
  beforeEach(() => {
    vi.mocked(getLoadLiquidCommands).mockReturnValue([])
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // The labware in the fixtures have namespace "fixture", which makes them
  // custom labware. Change their namespace to "opentrons" so that they're
  // treated as standard labware.
  const labwareEntitiesOpentrons = {
    ...labwareEntities,
    tiprackId: {
      ...labwareEntities.tiprackId,
      def: { ...labwareEntities.tiprackId.def, namespace: 'opentrons' },
    },
    plateId: {
      ...labwareEntities.plateId,
      def: { ...labwareEntities.plateId.def, namespace: 'opentrons' },
    },
    // We'll leave labwareEntities['fixedTrash'] with the "fixture" namespace,
    // to demonstrate what custom labware loading looks like.
  }

  const entities: InvariantContext = {
    moduleEntities: v7Fixture.moduleEntities,
    labwareEntities: labwareEntitiesOpentrons,
    pipetteEntities,
    liquidEntities: ingredients,
    wasteChuteEntities: {},
    trashBinEntities: {},
    gripperEntities: {},
    stagingAreaEntities: {},
    config: { OT_PD_DISABLE_MODULE_RESTRICTIONS: false },
  }

  it('should return a valid Python protocol file', () => {
    const result = createFile.resultFunc(
      fileMetadata,
      v7Fixture.initialRobotState,
      v7Fixture.robotStateTimeline,
      OT2_ROBOT_TYPE,
      dismissedWarnings,
      ingredLocations,
      v7Fixture.savedStepForms,
      v7Fixture.orderedStepIds,
      labwareNicknamesById,
      entities
    )
    // This is just a quick smoke test to make sure createPythonFile() produces
    // something that looks like a Python file. The individual sections of the
    // generated Python will be tested in separate unit tests.
    expect(result.pythonProtocol).toBe(
      `
import json
from opentrons import protocol_api, types

metadata = {
    "protocolName": "Test Protocol",
    "author": "The Author",
    "description": "Protocol description",
    "created": "2020-02-25T21:48:32.515Z",
    "protocolDesigner": "fake_PD_version",
    "source": "Protocol Designer",
}

requirements = {"robotType": "OT-2", "apiLevel": ${formatPyStr(PAPI_VERSION)}}

def run(protocol: protocol_api.ProtocolContext) -> None:
    # Load Labware:
    mock_python_name_1 = protocol.load_labware_from_definition(
        CUSTOM_LABWARE["fixture/fixture_trash/1"],
        location="12",
        label="Trash",
    )
    mock_python_name_2 = protocol.load_labware(
        "fixture_tiprack_10_ul",
        location="1",
        label="Opentrons 96 Tip Rack 10 µL",
        namespace="opentrons",
        version=1,
    )
    mock_python_name_3 = protocol.load_labware(
        "fixture_96_plate",
        location="7",
        label="NEST 96 Well Plate 100 µL PCR Full Skirt",
        namespace="opentrons",
        version=1,
    )

    # Load Pipettes:
    mock_python_name_1 = protocol.load_instrument("p10_single", "left")

    # PROTOCOL STEPS

    # Step 1: transfer
    # v7 fixture
    pass

CUSTOM_LABWARE = json.loads("""{"fixture/fixture_trash/1":{"ordering":[["A1"]],"schemaVersion":2,"version":1,"namespace":"fixture","metadata":{"displayCategory":"trash","displayVolumeUnits":"L","displayName":"Tall Fixed Trash","tags":["trash","opentrons","tall"]},"dimensions":{"xDimension":172.86,"yDimension":165.86,"zDimension":82},"parameters":{"format":"trash","isTiprack":false,"loadName":"fixture_trash","isMagneticModuleCompatible":false,"quirks":["fixedTrash","centerMultichannelOnWells","touchTipDisabled"]},"wells":{"A1":{"shape":"rectangular","yDimension":165.67,"xDimension":107.11,"totalLiquidVolume":1100000,"depth":77,"x":82.84,"y":53.56,"z":5}},"brand":{"brand":"Opentrons"},"groups":[{"wells":["A1"],"metadata":{}}],"cornerOffsetFromSlot":{"x":0,"y":0,"z":0}}}""")
`.trimStart()
    )

    expect(result.designerApplication).toEqual({
      designerApplication: {
        data: {
          dismissedWarnings: {
            form: [],
            timeline: [],
          },
          ingredLocations: {},
          ingredients: {},
          labware: {
            fixedTrash: {
              displayName: 'Trash',
              labwareDefURI: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
            },
            plateId: {
              displayName: 'NEST 96 Well Plate 100 µL PCR Full Skirt',
              labwareDefURI:
                'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
            },
            tiprackId: {
              displayName: 'Opentrons 96 Tip Rack 10 µL',
              labwareDefURI: 'opentrons/opentrons_96_tiprack_10ul/1',
            },
          },
          modules: {},
          orderedStepIds: ['moveLiquidStepId'],
          pipetteTiprackAssignments: {
            pipetteId: ['opentrons/opentrons_96_tiprack_10ul/1'],
          },
          pipettes: {
            pipetteId: {
              pipetteName: 'p10_single',
            },
          },
          savedStepForms: {
            __INITIAL_DECK_SETUP_STEP__: {
              id: '__INITIAL_DECK_SETUP_STEP__',
              labwareLocationUpdate: {
                fixedTrash: '12',
                plateId: '1',
                tiprackId: '2',
              },
              moduleLocationUpdate: {},
              pipetteLocationUpdate: {
                pipetteId: 'left',
              },
              stepType: 'manualIntervention',
            },
            moveLiquidStepId: {
              aspirate_airGap_checkbox: true,
              aspirate_airGap_volume: '1',
              aspirate_delay_checkbox: true,
              aspirate_delay_mmFromBottom: '1',
              aspirate_delay_seconds: '1',
              aspirate_flowRate: null,
              aspirate_labwareId: 'plateId',
              aspirate_mix_checkbox: false,
              aspirate_mix_times: null,
              aspirate_mix_volume: null,
              aspirate_mmFromBottom: '1',
              aspirate_touchTip_checkbox: false,
              aspirate_wellOrder_first: 't2b',
              aspirate_wellOrder_second: 'l2r',
              aspirate_wells: ['A1', 'B1'],
              aspirate_wells_grouped: false,
              blowout_checkbox: false,
              blowout_location: 'fixedTrash',
              changeTip: 'always',
              dispense_delay_checkbox: false,
              dispense_delay_mmFromBottom: '0.5',
              dispense_delay_seconds: '1',
              dispense_flowRate: null,
              dispense_labwareId: 'plateId',
              dispense_mix_checkbox: false,
              dispense_mix_times: null,
              dispense_mix_volume: null,
              dispense_mmFromBottom: '0.5',
              dispense_touchTip_checkbox: false,
              dispense_wellOrder_first: 't2b',
              dispense_wellOrder_second: 'l2r',
              dispense_wells: ['A12', 'B12'],
              disposalVolume_checkbox: true,
              disposalVolume_volume: '1',
              id: 'moveLiquidStepId',
              path: 'single',
              pipetteId: 'pipetteId',
              preWetTip: false,
              stepDetails: '',
              stepName: 'transfer',
              stepType: 'moveLiquid',
              volume: '5',
              stepNumber: 1,
            },
          },
        },
        version: '9.0.1',
        name: 'opentrons/protocol-designer',
      },
      robot: { model: OT2_ROBOT_TYPE },
      metadata: {
        author: 'The Author',
        created: 1582667312515,
        description: 'Protocol description',
        protocolName: 'Test Protocol',
        source: 'Protocol Designer',
      },
    })
  })
})

describe('getLabwareDefinitionsInUse util', () => {
  it('should exclude definitions that are neither on the deck nor assigned to a pipette', () => {
    const assignedTiprackOnDeckDef = fixture_tiprack_10_ul
    const assignedTiprackNotOnDeckDef = fixture_tiprack_300_ul
    const nonTiprackLabwareOnDeckDef = fixture_12_trough
    const nonTiprackLabwareNotOnDeckDef = fixture_96_plate
    // NOTE that assignedTiprackNotOnDeckDef and nonTiprackLabwareNotOnDeckDef are
    // missing from LabwareEntities bc they're not on the deck
    const labwareEntities: LabwareEntities = {
      someLabwareId: {
        id: 'someLabwareId',
        def: assignedTiprackOnDeckDef as LabwareDefinition2,
        labwareDefURI: 'assignedTiprackOnDeckURI',
        pythonName: 'mockPythonName',
      },
      otherLabwareId: {
        id: 'otherLabwareId',
        def: nonTiprackLabwareOnDeckDef as LabwareDefinition2,
        labwareDefURI: 'nonTiprackLabwareOnDeckURI',
        pythonName: 'mockPythonName',
      },
    }
    const allLabwareDefsByURI: LabwareDefByDefURI = {
      assignedTiprackOnDeckURI: assignedTiprackOnDeckDef as LabwareDefinition2,
      assignedTiprackNotOnDeckURI:
        assignedTiprackNotOnDeckDef as LabwareDefinition2,
      nonTiprackLabwareOnDeckURI:
        nonTiprackLabwareOnDeckDef as LabwareDefinition2,
      nonTiprackLabwareNotOnDeckURI:
        nonTiprackLabwareNotOnDeckDef as LabwareDefinition2,
    }
    const pipetteEntities: PipetteEntities = {
      somePipetteId: {
        id: 'somePipetteId',
        // @ts-expect-error(sa, 2021-6-18): not a valid pipette name
        name: 'foo',
        spec: fixtureP10SingleV2Specs,
        tiprackLabwareDef: [assignedTiprackOnDeckDef] as LabwareDefinition2[],
        tiprackDefURI: ['assignedTiprackOnDeckURI'],
      },
      otherPipetteId: {
        id: 'otherPipetteId',
        // @ts-expect-error(sa, 2021-6-18): not a valid pipette name
        name: 'foo',
        spec: fixtureP300SingleV2Specs,
        tiprackLabwareDef: [
          assignedTiprackNotOnDeckDef,
        ] as LabwareDefinition2[],
        tiprackDefURI: ['assignedTiprackNotOnDeckURI'],
      },
    }
    const result = getLabwareDefinitionsInUse(
      labwareEntities,
      pipetteEntities,
      allLabwareDefsByURI
    )
    expect(result).toEqual({
      assignedTiprackOnDeckURI: assignedTiprackOnDeckDef,
      assignedTiprackNotOnDeckURI: assignedTiprackNotOnDeckDef,
      nonTiprackLabwareOnDeckURI: nonTiprackLabwareOnDeckDef,
    })
  })
})
