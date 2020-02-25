// @flow
import { fixtureP10Single } from '@opentrons/shared-data/pipette/fixtures/name'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate.json'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import fixture_trash from '@opentrons/shared-data/labware/fixtures/2/fixture_trash.json'

// Named arguments to createFile selector. This data would be the result of several selectors.
// Copied from live PD runtime and modified to use fixture defs
export const engageMagnetProtocolFixture = {
  fileMetadata: {
    protocolName: 'Test Protocol',
    author: 'The Author',
    description: 'Protocol description',
    created: 1582667312515,
  },
  initialRobotState: {
    labware: {
      trashId: {
        slot: '12',
      },
      '911ce1f0-5818-11ea-aa14-bf80ae41e7fc:opentrons/opentrons_96_tiprack_10ul/1': {
        slot: '2',
      },
      '94d52f00-5818-11ea-aa14-bf80ae41e7fc:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1': {
        slot: '911c6cc0-5818-11ea-aa14-bf80ae41e7fc:magneticModuleType',
      },
    },
    modules: {
      '911c6cc0-5818-11ea-aa14-bf80ae41e7fc:magneticModuleType': {
        slot: '1',
        moduleState: {
          type: 'magneticModuleType',
          engaged: false,
        },
      },
    },
    pipettes: {
      '911ba970-5818-11ea-aa14-bf80ae41e7fc': {
        mount: 'left',
      },
    },
    liquidState: {
      pipettes: {
        '911ba970-5818-11ea-aa14-bf80ae41e7fc': {
          '0': {},
        },
      },
      labware: {
        trashId: {
          A1: {},
        },
        '911ce1f0-5818-11ea-aa14-bf80ae41e7fc:opentrons/opentrons_96_tiprack_10ul/1': {
          A1: {},
          B1: {},
          C1: {},
          D1: {},
          E1: {},
          F1: {},
          G1: {},
          H1: {},
          A2: {},
          B2: {},
          C2: {},
          D2: {},
          E2: {},
          F2: {},
          G2: {},
          H2: {},
          A3: {},
          B3: {},
          C3: {},
          D3: {},
          E3: {},
          F3: {},
          G3: {},
          H3: {},
          A4: {},
          B4: {},
          C4: {},
          D4: {},
          E4: {},
          F4: {},
          G4: {},
          H4: {},
          A5: {},
          B5: {},
          C5: {},
          D5: {},
          E5: {},
          F5: {},
          G5: {},
          H5: {},
          A6: {},
          B6: {},
          C6: {},
          D6: {},
          E6: {},
          F6: {},
          G6: {},
          H6: {},
          A7: {},
          B7: {},
          C7: {},
          D7: {},
          E7: {},
          F7: {},
          G7: {},
          H7: {},
          A8: {},
          B8: {},
          C8: {},
          D8: {},
          E8: {},
          F8: {},
          G8: {},
          H8: {},
          A9: {},
          B9: {},
          C9: {},
          D9: {},
          E9: {},
          F9: {},
          G9: {},
          H9: {},
          A10: {},
          B10: {},
          C10: {},
          D10: {},
          E10: {},
          F10: {},
          G10: {},
          H10: {},
          A11: {},
          B11: {},
          C11: {},
          D11: {},
          E11: {},
          F11: {},
          G11: {},
          H11: {},
          A12: {},
          B12: {},
          C12: {},
          D12: {},
          E12: {},
          F12: {},
          G12: {},
          H12: {},
        },
        '94d52f00-5818-11ea-aa14-bf80ae41e7fc:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1': {
          A1: {},
          B1: {},
          C1: {},
          D1: {},
          E1: {},
          F1: {},
          G1: {},
          H1: {},
          A2: {},
          B2: {},
          C2: {},
          D2: {},
          E2: {},
          F2: {},
          G2: {},
          H2: {},
          A3: {},
          B3: {},
          C3: {},
          D3: {},
          E3: {},
          F3: {},
          G3: {},
          H3: {},
          A4: {},
          B4: {},
          C4: {},
          D4: {},
          E4: {},
          F4: {},
          G4: {},
          H4: {},
          A5: {},
          B5: {},
          C5: {},
          D5: {},
          E5: {},
          F5: {},
          G5: {},
          H5: {},
          A6: {},
          B6: {},
          C6: {},
          D6: {},
          E6: {},
          F6: {},
          G6: {},
          H6: {},
          A7: {},
          B7: {},
          C7: {},
          D7: {},
          E7: {},
          F7: {},
          G7: {},
          H7: {},
          A8: {},
          B8: {},
          C8: {},
          D8: {},
          E8: {},
          F8: {},
          G8: {},
          H8: {},
          A9: {},
          B9: {},
          C9: {},
          D9: {},
          E9: {},
          F9: {},
          G9: {},
          H9: {},
          A10: {},
          B10: {},
          C10: {},
          D10: {},
          E10: {},
          F10: {},
          G10: {},
          H10: {},
          A11: {},
          B11: {},
          C11: {},
          D11: {},
          E11: {},
          F11: {},
          G11: {},
          H11: {},
          A12: {},
          B12: {},
          C12: {},
          D12: {},
          E12: {},
          F12: {},
          G12: {},
          H12: {},
        },
      },
    },
    tipState: {
      pipettes: {
        '911ba970-5818-11ea-aa14-bf80ae41e7fc': false,
      },
      tipracks: {
        '911ce1f0-5818-11ea-aa14-bf80ae41e7fc:opentrons/opentrons_96_tiprack_10ul/1': {
          A1: true,
          B1: true,
          C1: true,
          D1: true,
          E1: true,
          F1: true,
          G1: true,
          H1: true,
          A2: true,
          B2: true,
          C2: true,
          D2: true,
          E2: true,
          F2: true,
          G2: true,
          H2: true,
          A3: true,
          B3: true,
          C3: true,
          D3: true,
          E3: true,
          F3: true,
          G3: true,
          H3: true,
          A4: true,
          B4: true,
          C4: true,
          D4: true,
          E4: true,
          F4: true,
          G4: true,
          H4: true,
          A5: true,
          B5: true,
          C5: true,
          D5: true,
          E5: true,
          F5: true,
          G5: true,
          H5: true,
          A6: true,
          B6: true,
          C6: true,
          D6: true,
          E6: true,
          F6: true,
          G6: true,
          H6: true,
          A7: true,
          B7: true,
          C7: true,
          D7: true,
          E7: true,
          F7: true,
          G7: true,
          H7: true,
          A8: true,
          B8: true,
          C8: true,
          D8: true,
          E8: true,
          F8: true,
          G8: true,
          H8: true,
          A9: true,
          B9: true,
          C9: true,
          D9: true,
          E9: true,
          F9: true,
          G9: true,
          H9: true,
          A10: true,
          B10: true,
          C10: true,
          D10: true,
          E10: true,
          F10: true,
          G10: true,
          H10: true,
          A11: true,
          B11: true,
          C11: true,
          D11: true,
          E11: true,
          F11: true,
          G11: true,
          H11: true,
          A12: true,
          B12: true,
          C12: true,
          D12: true,
          E12: true,
          F12: true,
          G12: true,
          H12: true,
        },
      },
    },
  },
  robotStateTimeline: {
    timeline: [
      {
        commands: [
          {
            command: 'magneticModule/engageMagnet',
            params: {
              module: '911c6cc0-5818-11ea-aa14-bf80ae41e7fc:magneticModuleType',
              engageHeight: 16,
            },
          },
        ],
        robotState: {
          labware: {
            trashId: {
              slot: '12',
            },
            '911ce1f0-5818-11ea-aa14-bf80ae41e7fc:opentrons/opentrons_96_tiprack_10ul/1': {
              slot: '2',
            },
            '94d52f00-5818-11ea-aa14-bf80ae41e7fc:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1': {
              slot: '911c6cc0-5818-11ea-aa14-bf80ae41e7fc:magneticModuleType',
            },
          },
          modules: {
            '911c6cc0-5818-11ea-aa14-bf80ae41e7fc:magneticModuleType': {
              slot: '1',
              moduleState: {
                type: 'magneticModuleType',
                engaged: true,
              },
            },
          },
          pipettes: {
            '911ba970-5818-11ea-aa14-bf80ae41e7fc': {
              mount: 'left',
            },
          },
          liquidState: {
            pipettes: {
              '911ba970-5818-11ea-aa14-bf80ae41e7fc': {
                '0': {},
              },
            },
            labware: {
              trashId: {
                A1: {},
              },
              '911ce1f0-5818-11ea-aa14-bf80ae41e7fc:opentrons/opentrons_96_tiprack_10ul/1': {
                A1: {},
                B1: {},
                C1: {},
                D1: {},
                E1: {},
                F1: {},
                G1: {},
                H1: {},
                A2: {},
                B2: {},
                C2: {},
                D2: {},
                E2: {},
                F2: {},
                G2: {},
                H2: {},
                A3: {},
                B3: {},
                C3: {},
                D3: {},
                E3: {},
                F3: {},
                G3: {},
                H3: {},
                A4: {},
                B4: {},
                C4: {},
                D4: {},
                E4: {},
                F4: {},
                G4: {},
                H4: {},
                A5: {},
                B5: {},
                C5: {},
                D5: {},
                E5: {},
                F5: {},
                G5: {},
                H5: {},
                A6: {},
                B6: {},
                C6: {},
                D6: {},
                E6: {},
                F6: {},
                G6: {},
                H6: {},
                A7: {},
                B7: {},
                C7: {},
                D7: {},
                E7: {},
                F7: {},
                G7: {},
                H7: {},
                A8: {},
                B8: {},
                C8: {},
                D8: {},
                E8: {},
                F8: {},
                G8: {},
                H8: {},
                A9: {},
                B9: {},
                C9: {},
                D9: {},
                E9: {},
                F9: {},
                G9: {},
                H9: {},
                A10: {},
                B10: {},
                C10: {},
                D10: {},
                E10: {},
                F10: {},
                G10: {},
                H10: {},
                A11: {},
                B11: {},
                C11: {},
                D11: {},
                E11: {},
                F11: {},
                G11: {},
                H11: {},
                A12: {},
                B12: {},
                C12: {},
                D12: {},
                E12: {},
                F12: {},
                G12: {},
                H12: {},
              },
              '94d52f00-5818-11ea-aa14-bf80ae41e7fc:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1': {
                A1: {},
                B1: {},
                C1: {},
                D1: {},
                E1: {},
                F1: {},
                G1: {},
                H1: {},
                A2: {},
                B2: {},
                C2: {},
                D2: {},
                E2: {},
                F2: {},
                G2: {},
                H2: {},
                A3: {},
                B3: {},
                C3: {},
                D3: {},
                E3: {},
                F3: {},
                G3: {},
                H3: {},
                A4: {},
                B4: {},
                C4: {},
                D4: {},
                E4: {},
                F4: {},
                G4: {},
                H4: {},
                A5: {},
                B5: {},
                C5: {},
                D5: {},
                E5: {},
                F5: {},
                G5: {},
                H5: {},
                A6: {},
                B6: {},
                C6: {},
                D6: {},
                E6: {},
                F6: {},
                G6: {},
                H6: {},
                A7: {},
                B7: {},
                C7: {},
                D7: {},
                E7: {},
                F7: {},
                G7: {},
                H7: {},
                A8: {},
                B8: {},
                C8: {},
                D8: {},
                E8: {},
                F8: {},
                G8: {},
                H8: {},
                A9: {},
                B9: {},
                C9: {},
                D9: {},
                E9: {},
                F9: {},
                G9: {},
                H9: {},
                A10: {},
                B10: {},
                C10: {},
                D10: {},
                E10: {},
                F10: {},
                G10: {},
                H10: {},
                A11: {},
                B11: {},
                C11: {},
                D11: {},
                E11: {},
                F11: {},
                G11: {},
                H11: {},
                A12: {},
                B12: {},
                C12: {},
                D12: {},
                E12: {},
                F12: {},
                G12: {},
                H12: {},
              },
            },
          },
          tipState: {
            pipettes: {
              '911ba970-5818-11ea-aa14-bf80ae41e7fc': false,
            },
            tipracks: {
              '911ce1f0-5818-11ea-aa14-bf80ae41e7fc:opentrons/opentrons_96_tiprack_10ul/1': {
                A1: true,
                B1: true,
                C1: true,
                D1: true,
                E1: true,
                F1: true,
                G1: true,
                H1: true,
                A2: true,
                B2: true,
                C2: true,
                D2: true,
                E2: true,
                F2: true,
                G2: true,
                H2: true,
                A3: true,
                B3: true,
                C3: true,
                D3: true,
                E3: true,
                F3: true,
                G3: true,
                H3: true,
                A4: true,
                B4: true,
                C4: true,
                D4: true,
                E4: true,
                F4: true,
                G4: true,
                H4: true,
                A5: true,
                B5: true,
                C5: true,
                D5: true,
                E5: true,
                F5: true,
                G5: true,
                H5: true,
                A6: true,
                B6: true,
                C6: true,
                D6: true,
                E6: true,
                F6: true,
                G6: true,
                H6: true,
                A7: true,
                B7: true,
                C7: true,
                D7: true,
                E7: true,
                F7: true,
                G7: true,
                H7: true,
                A8: true,
                B8: true,
                C8: true,
                D8: true,
                E8: true,
                F8: true,
                G8: true,
                H8: true,
                A9: true,
                B9: true,
                C9: true,
                D9: true,
                E9: true,
                F9: true,
                G9: true,
                H9: true,
                A10: true,
                B10: true,
                C10: true,
                D10: true,
                E10: true,
                F10: true,
                G10: true,
                H10: true,
                A11: true,
                B11: true,
                C11: true,
                D11: true,
                E11: true,
                F11: true,
                G11: true,
                H11: true,
                A12: true,
                B12: true,
                C12: true,
                D12: true,
                E12: true,
                F12: true,
                G12: true,
                H12: true,
              },
            },
          },
        },
      },
    ],
    errors: null,
  },
  dismissedWarnings: {
    form: {},
    timeline: {},
  },
  ingredients: {},
  ingredLocations: {},
  savedStepForms: {
    __INITIAL_DECK_SETUP_STEP__: {
      stepType: 'manualIntervention',
      id: '__INITIAL_DECK_SETUP_STEP__',
      labwareLocationUpdate: {
        trashId: '12',
        '911ce1f0-5818-11ea-aa14-bf80ae41e7fc:opentrons/opentrons_96_tiprack_10ul/1':
          '2',
        '94d52f00-5818-11ea-aa14-bf80ae41e7fc:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1':
          '911c6cc0-5818-11ea-aa14-bf80ae41e7fc:magneticModuleType',
      },
      pipetteLocationUpdate: {
        '911ba970-5818-11ea-aa14-bf80ae41e7fc': 'left',
      },
      moduleLocationUpdate: {
        '911c6cc0-5818-11ea-aa14-bf80ae41e7fc:magneticModuleType': '1',
      },
    },
    'a09b4090-5818-11ea-aa14-bf80ae41e7fc': {
      id: 'a09b4090-5818-11ea-aa14-bf80ae41e7fc',
      stepType: 'magnet',
      stepName: 'magnet',
      stepDetails: '',
      moduleId: '911c6cc0-5818-11ea-aa14-bf80ae41e7fc:magneticModuleType',
      magnetAction: 'engage',
      engageHeight: '16',
    },
  },
  orderedStepIds: ['a09b4090-5818-11ea-aa14-bf80ae41e7fc'],
  labwareEntities: {
    trashId: {
      labwareDefURI: 'opentrons/opentrons_1_trash_1100ml_fixed/1',
      id: 'trashId',
      def: fixture_trash,
    },
    '911ce1f0-5818-11ea-aa14-bf80ae41e7fc:opentrons/opentrons_96_tiprack_10ul/1': {
      labwareDefURI: 'opentrons/opentrons_96_tiprack_10ul/1',
      id:
        '911ce1f0-5818-11ea-aa14-bf80ae41e7fc:opentrons/opentrons_96_tiprack_10ul/1',
      def: fixture_tiprack_10_ul,
    },
    '94d52f00-5818-11ea-aa14-bf80ae41e7fc:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1': {
      labwareDefURI: 'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      id:
        '94d52f00-5818-11ea-aa14-bf80ae41e7fc:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      def: fixture_96_plate,
    },
  },
  moduleEntities: {
    '911c6cc0-5818-11ea-aa14-bf80ae41e7fc:magneticModuleType': {
      id: '911c6cc0-5818-11ea-aa14-bf80ae41e7fc:magneticModuleType',
      type: 'magneticModuleType',
      model: 'magneticModuleV1',
    },
  },
  pipetteEntities: {
    '911ba970-5818-11ea-aa14-bf80ae41e7fc': {
      id: '911ba970-5818-11ea-aa14-bf80ae41e7fc',
      name: 'p10_single',
      spec: fixtureP10Single,
      tiprackDefURI: 'opentrons/opentrons_96_tiprack_10ul/1',
      tiprackLabwareDef: fixture_tiprack_10_ul,
    },
  },
  labwareNicknamesById: {
    trashId: 'Trash',
    '911ce1f0-5818-11ea-aa14-bf80ae41e7fc:opentrons/opentrons_96_tiprack_10ul/1':
      'Opentrons 96 Tip Rack 10 µL',
    '94d52f00-5818-11ea-aa14-bf80ae41e7fc:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1':
      'NEST 96 Well Plate 100 µL PCR Full Skirt',
  },
  labwareDefsByURI: {
    'opentrons/opentrons_96_tiprack_10ul/1': fixture_tiprack_10_ul,
    'opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1': fixture_96_plate,
    'opentrons/opentrons_1_trash_1100ml_fixed/1': fixture_trash,
  },
  modulesEnabled: true,
}
