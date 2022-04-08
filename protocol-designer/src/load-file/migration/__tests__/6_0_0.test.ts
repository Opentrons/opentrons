import { migrateFile } from '../6_0_0'
import _oldProtocol from 'protocol-designer/fixtures/protocol/5/doItAllV5.json'
import _oldProtocolMultipleLiquids from 'protocol-designer/fixtures/protocol/5/multipleLiquids.json'
import type { ProtocolFile, ProtocolFileV5 } from '@opentrons/shared-data'

const oldProtocol = (_oldProtocol as unknown) as ProtocolFileV5<any>

describe('v6 migration', () => {
  let migratedFile = {} as ProtocolFile
  beforeEach(() => {
    migratedFile = migrateFile(oldProtocol)
  })
  it('removes slot from modules and labware', () => {
    expect(
      oldProtocol.modules[
        '0b419310-75c7-11ea-b42f-4b64e50f43e5:magneticModuleType'
      ].slot
    ).toEqual('1')
    expect(
      oldProtocol.labware[
        '0b44c760-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_96_tiprack_300ul/1'
      ].slot
    ).toEqual('2')
    expect(
      migratedFile.modules[
        '0b419310-75c7-11ea-b42f-4b64e50f43e5:magneticModuleType'
        //  @ts-expect-error: slot does not exist in modules in v6
      ].slot
    ).toBeUndefined()
    expect(
      migratedFile.labware[
        '0b44c760-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_96_tiprack_300ul/1'
        //  @ts-expect-error: slot does not exist in labware in v6
      ].slot
    ).toBeUndefined()
  })
  it('removes mount from pipettes', () => {
    expect(
      oldProtocol.pipettes['0b3f2210-75c7-11ea-b42f-4b64e50f43e5'].mount
    ).toEqual('left')
    expect(
      //  @ts-expect-error: mount does not exist in pipettes in v6
      migratedFile.pipettes['0b3f2210-75c7-11ea-b42f-4b64e50f43e5'].mount
    ).toBeUndefined()
  })
  it('adds deckId to Robot', () => {
    expect(oldProtocol.robot).toEqual({ model: 'OT-2 Standard' })
    expect(migratedFile.robot).toEqual({
      model: 'OT-2 Standard',
      deckId: 'ot2_standard',
    })
  })
  it('adds a liquids key', () => {
    const expectedLiquids = { '0': { displayName: 'Water', description: null } }
    expect(migratedFile.liquids).toEqual(expectedLiquids)
  })
  it('creates loadModule commands', () => {
    const expectedLoadModuleCommands = [
      {
        key: expect.any(String),
        commandType: 'loadModule',
        params: {
          moduleId: '0b419310-75c7-11ea-b42f-4b64e50f43e5:magneticModuleType',
          location: { slotName: '1' },
        },
      },
      {
        key: expect.any(String),
        commandType: 'loadModule',
        params: {
          moduleId:
            '0b4319b0-75c7-11ea-b42f-4b64e50f43e5:temperatureModuleType',
          location: { slotName: '3' },
        },
      },
    ]

    const loadModuleCommands = migratedFile.commands.filter(
      command => command.commandType === 'loadModule'
    )
    expect(loadModuleCommands).toEqual(expectedLoadModuleCommands)
  })
  it('creates loadPipette commands', () => {
    const expectedLoadPipetteCommands = [
      {
        key: expect.any(String),
        commandType: 'loadPipette',
        params: {
          pipetteId: '0b3f2210-75c7-11ea-b42f-4b64e50f43e5',
          mount: 'left',
        },
      },
    ]
    const loadPipetteCommands = migratedFile.commands.filter(
      command => command.commandType === 'loadPipette'
    )
    expect(loadPipetteCommands).toEqual(expectedLoadPipetteCommands)
  })
  it('creates loadLabware commands', () => {
    const loadLabwareCommands = migratedFile.commands.filter(
      command => command.commandType === 'loadLabware'
    )
    const expectedLoadLabwareCommaands = [
      {
        key: expect.any(String),
        commandType: 'loadLabware',
        params: { labwareId: 'trashId', location: { slotName: '12' } },
      },
      {
        key: expect.any(String),
        commandType: 'loadLabware',
        params: {
          labwareId:
            '0b44c760-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_96_tiprack_300ul/1',
          location: { slotName: '2' },
        },
      },
      {
        key: expect.any(String),
        commandType: 'loadLabware',
        params: {
          labwareId:
            '1e610d40-75c7-11ea-b42f-4b64e50f43e5:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
          location: {
            slotName: '0b419310-75c7-11ea-b42f-4b64e50f43e5:magneticModuleType',
          },
        },
      },
      {
        key: expect.any(String),
        commandType: 'loadLabware',
        params: {
          labwareId:
            '21ed8f60-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_24_aluminumblock_generic_2ml_screwcap/1',
          location: {
            slotName:
              '0b4319b0-75c7-11ea-b42f-4b64e50f43e5:temperatureModuleType',
          },
        },
      },
    ]
    expect(loadLabwareCommands).toEqual(expectedLoadLabwareCommaands)
  })
  it('creates loadLiquid commands', () => {
    const expectedLoadLiquidCommands = [
      {
        key: expect.any(String),
        commandType: 'loadLiquid',
        params: {
          liquidId: '0',
          labwareId: '6114d3d0-b759-11ec-81e8-7fa12dc3e861:opentrons/opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap/1', // this is just taken from the fixture
          volumeByWell: {
            A1: 222,
            B1: 222,
            C1: 222,
            D1: 222,
            A2: 222,
            B2: 222,
            C2: 222,
            D2: 222,
          },
        },
      },
      {
        key: expect.any(String),
        commandType: 'loadLiquid',
        params: {
          liquidId: '1',
          labwareId: '6114d3d0-b759-11ec-81e8-7fa12dc3e861:opentrons/opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap/1', // this is just taken from the fixture
          volumeByWell: {
            A3: 333,
            B3: 333,
            C3: 333,
            D3: 333,
            A4: 333,
            B4: 333,
            C4: 333,
            D4: 333,
          },
        },
      },
      {
        key: expect.any(String),
        commandType: 'loadLiquid',
        params: {
          liquidId: '2',
          labwareId: '6114d3d0-b759-11ec-81e8-7fa12dc3e861:opentrons/opentrons_24_tuberack_eppendorf_1.5ml_safelock_snapcap/1', // this is just taken from the fixture
          volumeByWell: {
            A5: 444,
            B5: 444,
            C5: 444,
            D5: 444,
            A6: 444,
            B6: 444,
            C6: 444,
            D6: 444,
          },
        },
      },
      {
        key: expect.any(String),
        commandType: 'loadLiquid',
        params: {
          liquidId: '0',
          labwareId: '64c66a20-b759-11ec-81e8-7fa12dc3e861:opentrons/usascientific_96_wellplate_2.4ml_deep/1', // this is just taken from the fixture
          volumeByWell: {
            A1: 555,
            B1: 555,
            C1: 555,
            D1: 555,
            E1: 555,
            F1: 555,
            G1: 555,
            H1: 555,
            A2: 555,
            B2: 555,
            C2: 555,
            D2: 555,
            E2: 555,
            F2: 555,
            G2: 555,
            H2: 555,
            A3: 555,
            B3: 555,
            C3: 555,
            D3: 555,
            E3: 555,
            F3: 555,
            G3: 555,
            H3: 555,
          },
        },
      },
      {
        key: expect.any(String),
        commandType: 'loadLiquid',
        params: {
          liquidId: '1',
          labwareId: '64c66a20-b759-11ec-81e8-7fa12dc3e861:opentrons/usascientific_96_wellplate_2.4ml_deep/1', // this is just taken from the fixture
          volumeByWell: {
            A4: 666,
            B4: 666,
            C4: 666,
            D4: 666,
            E4: 666,
            F4: 666,
            G4: 666,
            H4: 666,
            A5: 666,
            B5: 666,
            C5: 666,
            D5: 666,
            E5: 666,
            F5: 666,
            G5: 666,
            H5: 666,
            A6: 666,
            B6: 666,
            C6: 666,
            D6: 666,
            E6: 666,
            F6: 666,
            G6: 666,
            H6: 666,
          },
        },
      },
      {
        key: expect.any(String),
        commandType: 'loadLiquid',
        params: {
          liquidId: '2',
          labwareId: '64c66a20-b759-11ec-81e8-7fa12dc3e861:opentrons/usascientific_96_wellplate_2.4ml_deep/1', // this is just taken from the fixture
          volumeByWell: {
            A7: 777,
            B7: 777,
            C7: 777,
            D7: 777,
            E7: 777,
            F7: 777,
            G7: 777,
            H7: 777,
            A8: 777,
            B8: 777,
            C8: 777,
            D8: 777,
            E8: 777,
            F8: 777,
            G8: 777,
            H8: 777,
            A9: 777,
            B9: 777,
            C9: 777,
            D9: 777,
            E9: 777,
            F9: 777,
            G9: 777,
            H9: 777,
            A10: 777,
            B10: 777,
            C10: 777,
            D10: 777,
            E10: 777,
            F10: 777,
            G10: 777,
            H10: 777,
            A11: 777,
            B11: 777,
            C11: 777,
            D11: 777,
            E11: 777,
            F11: 777,
            G11: 777,
            H11: 777,
            A12: 777,
            B12: 777,
            C12: 777,
            D12: 777,
            E12: 777,
            F12: 777,
            G12: 777,
            H12: 777
          }
        },
      }
    ]

    const migratedLiquidsFile = migrateFile(_oldProtocolMultipleLiquids as any)
    const loadLiquidCommands = migratedLiquidsFile.commands.filter(
      command => command.commandType === 'loadLiquid'
    )
    expect(loadLiquidCommands).toEqual(expect.arrayContaining(expectedLoadLiquidCommands))
  })
  it('replaces air gap commands with aspirate commands', () => {
    const expectedConvertedAirgapCommands = [
      {
        key: expect.any(String), // no key used to exist in v5 commands
        commandType: 'aspirate', // used to be airGap
        params: {
          pipetteId: '0b3f2210-75c7-11ea-b42f-4b64e50f43e5', // used to be pipette
          volume: 30,
          labwareId:
            '1e610d40-75c7-11ea-b42f-4b64e50f43e5:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1', // used to be labware
          offsetFromBottomMm: 15.78,
          flowRate: 46.43,
          wellName: 'A1',
        },
      },
      {
        key: expect.any(String), // no key used to exist in v5 commands
        commandType: 'aspirate', // used to be airGap
        params: {
          pipetteId: '0b3f2210-75c7-11ea-b42f-4b64e50f43e5', // used to be pipette
          volume: 30,
          labwareId:
            '1e610d40-75c7-11ea-b42f-4b64e50f43e5:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1', // used to be labware
          offsetFromBottomMm: 15.78,
          flowRate: 46.43,
          wellName: 'B1',
        },
      },
    ]
    expect(migratedFile.commands).toEqual(
      expect.arrayContaining(expectedConvertedAirgapCommands)
    )
  })
})
