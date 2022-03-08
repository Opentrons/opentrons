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
        //  @ts-expect-error: slot does not exist in modules in v6
      ].slot
    ).toEqual(undefined)
    expect(
      migratedFile.labware[
        '0b44c760-75c7-11ea-b42f-4b64e50f43e5:opentrons/opentrons_96_tiprack_300ul/1'
        //  @ts-expect-error: slot does not exist in labware in v6
      ].slot
    ).toEqual(undefined)
  })
  it('removes mount from pipettes', () => {
    expect(
      oldProtocol.pipettes['0b3f2210-75c7-11ea-b42f-4b64e50f43e5'].mount
    ).toEqual('left')
    expect(
      //  @ts-expect-error: mount does not exist in pipettes in v6
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
    expect('loadModule' in migratedFile.commands).not.toBeNull()
    expect('slotName' in migratedFile.commands).not.toBeNull()
    expect('moduleId' in migratedFile.commands).not.toBeNull()
  })
  it('creates loadPipette commands with correct info', () => {
    expect('loadPipette' in migratedFile.commands).not.toBeNull()
    expect('mount' in migratedFile.commands).not.toBeNull()
    expect('pipetteId' in migratedFile.commands).not.toBeNull()
  })
  it('creates loadLabware commands with correct info', () => {
    expect('loadLabware' in migratedFile.commands).not.toBeNull()
    expect('slotName' in migratedFile.commands).not.toBeNull()
    expect('labwareId' in migratedFile.commands).not.toBeNull()
  })
  it('changes command to commandType and well to wellName', () => {
    expect('well' in oldProtocol.commands).not.toBeNull()
    expect('wellName' in migratedFile.commands).toBeFalsy()
    expect('wellName' in migratedFile.commands).not.toBeNull()
  })
  it('changes airGap commandType to aspirate', () => {
    expect('airGap' in oldProtocol.commands).not.toBeNull()
    expect('airGap' in migratedFile.commands).toBeFalsy()
    expect('aspirate' in migratedFile.commands).not.toBeNull()
  })
})
