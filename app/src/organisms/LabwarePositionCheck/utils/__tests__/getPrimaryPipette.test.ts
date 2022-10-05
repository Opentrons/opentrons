import { getPrimaryPipetteId } from '../getPrimaryPipetteId'
import { ProtocolFile } from '@opentrons/shared-data'
import { LoadPipetteRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'

describe('getPrimaryPipetteId', () => {
  it('should return the one and only pipette if there is only one pipette in the protocol', () => {
    const mockPipette: ProtocolFile<{}>['pipettes'] = {
      0: {
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        id: 'p10SingleId',
        pipetteName: 'p10_single',
      },
    }
    expect(getPrimaryPipetteId({ ...mockPipette }, [])).toBe('p10SingleId')
  })
  it('should throw an error if there are two pipettes with the same mount', () => {
    const loadPipetteCommands: LoadPipetteRunTimeCommand[] = [
      {
        id: '1',
        commandType: 'loadPipette',
        params: {
          pipetteId: 'p10SingleId',
          mount: 'left',
        },
      },
      {
        id: '1',
        commandType: 'loadPipette',
        params: {
          pipetteId: 'p10MultiId',
          mount: 'left',
        },
      },
    ] as any

    const p10Single: ProtocolFile<{}>['pipettes'] = {
      0: {
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        id: 'p10SingleId',
        pipetteName: 'p10_single',
      },
    }
    const p10Multi: ProtocolFile<{}>['pipettes'] = {
      1: {
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        id: 'p10MultiId',
        pipetteName: 'p10_multi',
      },
    }

    const pipettes = {
      ...p10Single,
      ...p10Multi,
    }
    expect(() => getPrimaryPipetteId(pipettes, loadPipetteCommands)).toThrow(
      'expected to find both left pipette and right pipette but could not'
    )
  })
  it('should return the pipette with fewer channels', () => {
    const loadPipetteCommands: LoadPipetteRunTimeCommand[] = [
      {
        id: '1',
        commandType: 'loadPipette',
        params: {
          pipetteId: 'p10SingleId',
          mount: 'left',
        },
        result: {
          pipetteId: 'p10SingleId',
        },
      },
      {
        id: '1',
        commandType: 'loadPipette',
        params: {
          pipetteId: 'p10MultiId',
          mount: 'right',
        },
        result: {
          pipetteId: 'p10MultiId',
        },
      },
    ] as any
    const p10Single: ProtocolFile<{}>['pipettes'] = {
      0: {
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        id: 'p10SingleId',
        pipetteName: 'p10_single',
      },
    }
    const p10Multi: ProtocolFile<{}>['pipettes'] = {
      1: {
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        id: 'p10MultiId',
        pipetteName: 'p10_multi',
      },
    }

    const pipettes = {
      ...p10Single,
      ...p10Multi,
    }
    expect(getPrimaryPipetteId(pipettes, loadPipetteCommands)).toBe(
      'p10SingleId'
    )
  })
  it('should return the smaller pipette', () => {
    const loadPipetteCommands: LoadPipetteRunTimeCommand[] = [
      {
        id: '1',
        commandType: 'loadPipette',
        params: {
          pipetteId: 'p10SingleId',
          mount: 'left',
        },
        result: {
          pipetteId: 'p10SingleId',
        },
      },
      {
        id: '1',
        commandType: 'loadPipette',
        params: {
          pipetteId: 'p50MultiId',
          mount: 'right',
        },
        result: {
          pipetteId: 'p50MultiId',
        },
      },
    ] as any

    const p10Single: ProtocolFile<{}>['pipettes'] = {
      0: {
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        id: 'p10SingleId',
        pipetteName: 'p10_single',
      },
    }
    const p50Multi: ProtocolFile<{}>['pipettes'] = {
      1: {
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        id: 'p50MultiId',
        pipetteName: 'p50_single',
      },
    }

    const pipettes = {
      ...p10Single,
      ...p50Multi,
    }
    expect(getPrimaryPipetteId(pipettes, loadPipetteCommands)).toBe(
      'p10SingleId'
    )
  })
  it('should return the newer model', () => {
    const loadPipetteCommands: LoadPipetteRunTimeCommand[] = [
      {
        id: '1',
        commandType: 'loadPipette',
        params: {
          pipetteId: 'p300SingleId',
          mount: 'left',
        },
        result: {
          pipetteId: 'p300SingleId',
        },
      },
      {
        id: '1',
        commandType: 'loadPipette',
        params: {
          pipetteId: 'p300SingleGen2Id',
          mount: 'right',
        },
        result: {
          pipetteId: 'p300SingleGen2Id',
        },
      },
    ] as any

    const p300Single: ProtocolFile<{}>['pipettes'] = {
      0: {
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        id: 'p300SingleId',
        pipetteName: 'p300_single',
      },
    }
    const p300SingleGen2: ProtocolFile<{}>['pipettes'] = {
      1: {
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        id: 'p300SingleGen2Id',
        pipetteName: 'p300_single_gen2',
      },
    }

    const pipettes = {
      ...p300Single,
      ...p300SingleGen2,
    }
    expect(getPrimaryPipetteId(pipettes, loadPipetteCommands)).toBe(
      'p300SingleGen2Id'
    )
  })

  it('should return the left pipette when all else is the same', () => {
    const loadPipetteCommands: LoadPipetteRunTimeCommand[] = [
      {
        id: '1',
        commandType: 'loadPipette',
        params: {
          pipetteId: 'p300SingleLeftId',
          mount: 'left',
        },
        result: {
          pipetteId: 'p300SingleLeftId',
        },
      },
      {
        id: '1',
        commandType: 'loadPipette',
        params: {
          pipetteId: 'p300SingleRightId',
          mount: 'right',
        },
        result: {
          pipetteId: 'p300SingleRightId',
        },
      },
    ] as any

    const p300SingleLeft: ProtocolFile<{}>['pipettes'] = {
      0: {
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        id: 'p300SingleLeftId',
        pipetteName: 'p300_single',
      },
    }
    const p300SingleRight: ProtocolFile<{}>['pipettes'] = {
      1: {
        //  @ts-expect-error: id will exist when we remove the schemaV6Adapter
        id: 'p300SingleRightId',
        pipetteName: 'p300_single',
      },
    }

    const pipettes = {
      ...p300SingleLeft,
      ...p300SingleRight,
    }
    expect(getPrimaryPipetteId(pipettes, loadPipetteCommands)).toBe(
      'p300SingleLeftId'
    )
  })
})
