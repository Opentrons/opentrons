import { migrateFile } from '../6_0_0'
import oldProtocol from 'protocol-designer/fixtures/protocol/5/doItAllV5.json'

describe('v6 migration', () => {
  const migratedFile = migrateFile(oldProtocol)
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
      ].slot
    ).toEqual(undefined)
    expect(
      migratedFile.labware[
        '0b44c760-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_96_tiprack_300ul/1'
      ].slot
    ).toEqual(undefined)
  })
  it('removed mount from pipettes', () => {
    expect(
      oldProtocol.pipettes['0b3f2210-75c7-11ea-b42f-4b64e50f43e5'].mount
    ).toEqual('left')
    expect(
      migratedFile.pipettes['0b3f2210-75c7-11ea-b42f-4b64e50f43e5'].mount
    ).toEqual(undefined)
  })
  it('adds deckId to Robot', () => {
    expect(oldProtocol.robot).toEqual({ model: 'OT-2 Standard' })
    expect(migratedFile.robot).toEqual({
      model: 'OT-2 Standard',
      deckId: 'ot2_standard',
    })
  })
  it('creates loadModule commands with correct info', () => {
    expect(migratedFile.commands[1].commandType).toEqual('loadModule')
    expect(migratedFile.commands[1].params).toEqual({
      location: { slotName: '1' },
      moduleId: '0b419310-75c7-11ea-b42f-4b64e50f43e5:magneticModuleType',
    })
  })
  it('creates loadPipette commands with correct info', () => {
    expect(migratedFile.commands[0].commandType).toEqual('loadPipette')
    expect(migratedFile.commands[0].params).toEqual({
      mount: 'left',
      pipetteId: '0b3f2210-75c7-11ea-b42f-4b64e50f43e5',
    })
  })
  it('creates loadLabware commands with correct info', () => {
    expect(migratedFile.commands[4].commandType).toEqual('loadLabware')
    expect(migratedFile.commands[4].params).toEqual({
      labwareId:
        '0b44c760-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_96_tiprack_300ul/1',
      location: { slotName: '2' },
    })
  })
  it('changes command to commandType and well to wellName', () => {
    expect(oldProtocol.commands[2].command).toEqual('delay')
    expect(oldProtocol.commands[2].params).toEqual({
      message: '',
      wait: 62,
      well: undefined,
    })
    expect(migratedFile.commands[9].commandType).toEqual('delay')
    expect(migratedFile.commands[9].params).toEqual({
      message: '',
      wait: 62,
      wellName: undefined,
    })
  })
  it('changes airGap commandType to aspirate', () => {
    expect(oldProtocol.commands[7].command).toEqual('airGap')
    expect(migratedFile.commands[14].commandType).toEqual('aspirate')
  })
})
