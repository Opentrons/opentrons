import { migrateFile } from '../6_0_0'
import _oldProtocol from 'protocol-designer/fixtures/protocol/5/doItAllV5.json'
import type {
  CreateCommand,
  ProtocolFile,
  ProtocolFileV5,
} from '@opentrons/shared-data'

const oldProtocol = (_oldProtocol as unknown) as ProtocolFileV5<{}>

describe('v6 migration', () => {
  let migratedFile = {} as ProtocolFile<{}, CreateCommand>
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
