// @flow
import merge from 'lodash/merge'
import {createRobotState} from './fixtures' // getTipColumn, getTiprackTipstate, createEmptyLiquidState
import transfer from '../transfer'
import {FIXED_TRASH_ID} from '../../constants'

let transferArgs
let robotInitialState

beforeEach(() => {
  transferArgs = {
    stepType: 'transfer',
    name: 'Transfer Test',
    description: 'test blah blah',
    pipette: 'p300SingleId',

    sourceLabware: 'sourcePlateId',
    destLabware: 'destPlateId',

    preWetTip: false,
    touchTipAfterAspirate: false,
    disposalVolume: null,
    mixBeforeAspirate: null,

    touchTipAfterDispense: false,
    mixInDestination: null,
    delayAfterDispense: null,
    blowout: null
  }

  robotInitialState = createRobotState({
    sourcePlateType: '96-flat',
    destPlateType: '96-flat',
    tipracks: [200],
    fillPipetteTips: true,
    fillTiprackTips: true
  })
})

describe('pick up tip if no tip on pipette', () => {
  beforeEach(() => {
    transferArgs = {
      ...transferArgs,
      sourceWells: ['A1'],
      destWells: ['B2'],
      volume: 30
    }

    // no tip on pipette
    robotInitialState.tipState.pipettes.p300SingleId = false
  })

  const changeTipOptions = ['once', 'always']

  changeTipOptions.forEach(changeTip => {
    test(`...${changeTip}`, () => {
      transferArgs = {
        ...transferArgs,
        changeTip
      }

      const result = transfer(transferArgs)(robotInitialState)

      expect(result.commands[0]).toEqual(
        {
          command: 'pick-up-tip',
          pipette: 'p300SingleId',
          labware: 'tiprack1Id',
          well: 'A1'
        }
      )
    })
  })

  test('...never (should not pick up tip, and fail)', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'never'
    }

    expect(
      // $FlowFixMe // TODO Ian 2018-04-02: here, flow doesn't like transferArgs fields
      () => transfer(transferArgs)(robotInitialState)
    ).toThrow(/Attempted to aspirate with no tip.*/)
  })
})

test('single transfer: 1 source & 1 dest', () => {
  transferArgs = {
    ...transferArgs,
    sourceWells: ['A1'],
    destWells: ['B2'],
    changeTip: 'never',
    volume: 30
  }

  robotInitialState.liquidState.labware.sourcePlateId.A1 = {'0': {volume: 200}}

  const result = transfer(transferArgs)(robotInitialState)
  expect(result.commands).toEqual([
    {
      command: 'aspirate',
      labware: 'sourcePlateId',
      pipette: 'p300SingleId',
      volume: 30,
      well: 'A1'
    },
    {
      command: 'dispense',
      labware: 'destPlateId',
      pipette: 'p300SingleId',
      volume: 30,
      well: 'B2'
    }
  ])

  expect(result.robotState.liquidState).toEqual(merge(
    {},
    robotInitialState.liquidState,
    {
      labware: {
        sourcePlateId: {A1: {'0': {volume: 200 - 30}}},
        destPlateId: {B2: {'0': {volume: 30}}}
      },
      pipettes: {
        p300SingleId: {'0': {'0': {volume: 0}}} // pipette's Tip 0 has 0uL of Ingred 0 (contamination)
      }
    }
  ))
})

test('transfer with multiple sets of wells', () => {
  transferArgs = {
    ...transferArgs,
    sourceWells: ['A1', 'A2'],
    destWells: ['B2', 'C2'],
    changeTip: 'never',
    volume: 30
  }
  const result = transfer(transferArgs)(robotInitialState)
  expect(result.commands).toEqual([
    {
      command: 'aspirate',
      labware: 'sourcePlateId',
      pipette: 'p300SingleId',
      volume: 30,
      well: 'A1'
    },
    {
      command: 'dispense',
      labware: 'destPlateId',
      pipette: 'p300SingleId',
      volume: 30,
      well: 'B2'
    },

    {
      command: 'aspirate',
      labware: 'sourcePlateId',
      pipette: 'p300SingleId',
      volume: 30,
      well: 'A2'
    },
    {
      command: 'dispense',
      labware: 'destPlateId',
      pipette: 'p300SingleId',
      volume: 30,
      well: 'C2'
    }
  ])

  // TODO Ian 2018-04-02 robotState, liquidState checks
})

describe('single transfer exceeding pipette max', () => {
  beforeEach(() => {
    transferArgs = {
      ...transferArgs,
      sourceWells: ['A1'],
      destWells: ['B2'],
      volume: 350
    }
    // tip setup: tiprack's A1 has tip, pipette has no tip
    robotInitialState.tipState.tipracks.tiprack1Id.A1 = true
    robotInitialState.tipState.pipettes.p300SingleId = false
    // liquid setup
    robotInitialState.liquidState.labware.sourcePlateId.A1 = {'0': {volume: 400}}
  })

  test('changeTip="once"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'once'
    }

    const result = transfer(transferArgs)(robotInitialState)
    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },

      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'B2'
      },

      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 50,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 50,
        well: 'B2'
      }
    ])

    expect(result.robotState.liquidState).toEqual(merge(
      {},
      robotInitialState.liquidState,
      {
        labware: {
          sourcePlateId: {A1: {'0': {volume: 400 - 350}}},
          destPlateId: {B2: {'0': {volume: 350}}}
        },
        pipettes: {
          p300SingleId: {'0': {'0': {volume: 0}}} // pipette's Tip 0 has 0uL of Ingred 0 (contamination)
        }
      }
    ))
  })

  test('changeTip="always"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'always'
    }

    const result = transfer(transferArgs)(robotInitialState)
    expect(result.commands).toEqual([
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'A1'
      },

      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'B2'
      },

      // replace tip before next asp-disp chunk
      {
        command: 'drop-tip',
        pipette: 'p300SingleId',
        labware: FIXED_TRASH_ID,
        well: 'A1'
      },
      {
        command: 'pick-up-tip',
        pipette: 'p300SingleId',
        labware: 'tiprack1Id',
        well: 'B1'
      },

      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 50,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 50,
        well: 'B2'
      }
    ])

    expect(result.robotState.liquidState).toEqual(merge(
      {},
      robotInitialState.liquidState,
      {
        labware: {
          sourcePlateId: {A1: {'0': {volume: 400 - 350}}},
          destPlateId: {B2: {'0': {volume: 350}}},
          [FIXED_TRASH_ID]: result.robotState.liquidState.labware[FIXED_TRASH_ID] // Ignore liquid contents of trash. TODO LATER make this more elegant
        },
        pipettes: {
          p300SingleId: {'0': {'0': {volume: 0}}} // pipette's Tip 0 has 0uL of Ingred 0 (contamination)
        }
      }
    ))
  })

  test('changeTip="never"', () => {
    transferArgs = {
      ...transferArgs,
      changeTip: 'never'
    }
    // begin with tip on pipette
    robotInitialState.tipState.pipettes.p300SingleId = true

    const result = transfer(transferArgs)(robotInitialState)
    expect(result.commands).toEqual([
      // no pick up tip
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'B2'
      },

      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 50,
        well: 'A1'
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 50,
        well: 'B2'
      }
    ])

    expect(result.robotState.liquidState).toEqual(merge(
      {},
      robotInitialState.liquidState,
      {
        labware: {
          sourcePlateId: {A1: {'0': {volume: 400 - 350}}},
          destPlateId: {B2: {'0': {volume: 350}}}
        },
        pipettes: {
          p300SingleId: {'0': {'0': {volume: 0}}} // pipette's Tip 0 has 0uL of Ingred 0 (contamination)
        }
      }
    ))
  })
})

describe('advanced options', () => {
  beforeEach(() => {
    transferArgs = {
      ...transferArgs,
      sourceWells: ['A1'],
      destWells: ['B1'],
      changeTip: 'never'
    }
  })
  describe('...aspirate options', () => {
    test('pre-wet tip should aspirate and dispense transfer volume from source well of each subtransfer', () => {
      transferArgs = {
        ...transferArgs,
        volume: 350,
        preWetTip: true
      }

      const result = transfer(transferArgs)(robotInitialState)
      expect(result.commands).toEqual([
        // pre-wet aspirate/dispense
        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'A1'
        },

        // "real" aspirate/dispenses
        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'B1'
        },

        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'B1'
        }
      ])
    })

    test('touch-tip after aspirate should touch-tip on each source well, for every aspirate', () => {
      transferArgs = {
        ...transferArgs,
        volume: 350,
        touchTipAfterAspirate: true
      }

      const result = transfer(transferArgs)(robotInitialState)
      expect(result.commands).toEqual([
        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'A1'
        },
        {
          command: 'touch-tip',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'B1'
        },

        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'A1'
        },
        {
          command: 'touch-tip',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'B1'
        }
      ])
    })

    test('touch-tip after dispense should touch-tip on each dest well, for every dispense', () => {
      transferArgs = {
        ...transferArgs,
        volume: 350,
        touchTipAfterDispense: true
      }

      const result = transfer(transferArgs)(robotInitialState)
      expect(result.commands).toEqual([
        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'B1'
        },
        {
          command: 'touch-tip',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          well: 'B1'
        },

        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'B1'
        },
        {
          command: 'touch-tip',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          well: 'B1'
        }
      ])
    })

    test('mix before aspirate', () => {
      transferArgs = {
        ...transferArgs,
        volume: 350,
        mixBeforeAspirate: {
          volume: 250,
          times: 2
        }
      }

      // written here for less verbose `commands` below
      const mixCommands = [
        // mix 1
        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 250,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 250,
          well: 'A1'
        },
        // mix 2
        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 250,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 250,
          well: 'A1'
        }
      ]

      const result = transfer(transferArgs)(robotInitialState)
      expect(result.commands).toEqual([
        ...mixCommands,
        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'B1'
        },

        ...mixCommands,
        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'B1'
        }
      ])
    })
    test('air gap => ???') // TODO determine behavior
    test('disposal volume => ???') // TODO determine behavior
  })

  describe('...dispense options', () => {
    test('mix after dispense', () => {
      transferArgs = {
        ...transferArgs,
        volume: 350,
        mixInDestination: {
          volume: 250,
          times: 2
        }
      }

      // written here for less verbose `commands` below
      const mixCommands = [
        // mix 1
        {
          command: 'aspirate',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 250,
          well: 'B1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 250,
          well: 'B1'
        },
        // mix 2
        {
          command: 'aspirate',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 250,
          well: 'B1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 250,
          well: 'B1'
        }
      ]

      const result = transfer(transferArgs)(robotInitialState)
      expect(result.commands).toEqual([
        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'B1'
        },
        ...mixCommands,

        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'B1'
        },
        ...mixCommands
      ])
    })

    test.skip('delay after dispense', () => { // TODO Ian 2018-04-05 support delay in transfer. REMOVE SKIP
      transferArgs = {
        ...transferArgs,
        volume: 350,
        delayAfterDispense: 100
      }

      const result = transfer(transferArgs)(robotInitialState)

      const delayCommand = {
        command: 'delay',
        wait: 100,
        message: null
      }

      expect(result.commands).toEqual([
        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 300,
          well: 'B1'
        },
        delayCommand,

        {
          command: 'aspirate',
          labware: 'sourcePlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'A1'
        },
        {
          command: 'dispense',
          labware: 'destPlateId',
          pipette: 'p300SingleId',
          volume: 50,
          well: 'B1'
        },
        delayCommand
      ])
    })
    test('blowout should blowout in specified labware after each dispense') // TODO
  })
})
