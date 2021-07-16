import { createTimelineFromCommands } from '../utils/createTimelineFromCommands'
import {
  makeContext,
  getInitialRobotStateStandard,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
  TROUGH_LABWARE,
} from '../fixtures'

import { Command, InvariantContext, RobotState } from '../types'

const getRobotInitialState = (): any => {
  // This particular state shouldn't matter for delay
  return {}
}

// neither should InvariantContext
const invariantContext: any = {}

const commands: Command[] = [
  {
    command: 'pickUpTip',
    params: {
      pipette: DEFAULT_PIPETTE,
      labware: 'tiprack1Id',
      well: 'B1',
    },
  },
  {
    command: 'aspirate',
    params: {
      pipette: DEFAULT_PIPETTE,
      labware: SOURCE_LABWARE,
      well: 'A1',
      volume: 5,
      flowRate: 3,
      offsetFromBottomMm: 2,
    },
  },
  {
    command: 'delay',
    params: {
      wait: 42,
    },
  },
  {
    command: 'dispense',
    params: {
      pipette: DEFAULT_PIPETTE,
      labware: TROUGH_LABWARE,
      well: 'B1',
      volume: 4.5,
      flowRate: 2.5,
      offsetFromBottomMm: 1,
    },
  },
  {
    command: 'touchTip',
    params: {
      pipette: DEFAULT_PIPETTE,
      labware: TROUGH_LABWARE,
      well: 'B1',
      offsetFromBottomMm: 11,
    },
  },
  {
    command: 'blowout',
    params: {
      pipette: DEFAULT_PIPETTE,
      labware: TROUGH_LABWARE,
      well: 'B1',
      flowRate: 2,
      offsetFromBottomMm: 12,
    },
  },
  {
    command: 'moveToSlot',
    params: {
      pipette: DEFAULT_PIPETTE,
      slot: '5',
      offset: {
        x: 1,
        y: 2,
        z: 3,
      },
    },
  },
  {
    command: 'moveToWell',
    params: {
      pipette: DEFAULT_PIPETTE,
      labware: TROUGH_LABWARE,
      well: 'B2',
    },
  },
  {
    command: 'moveToWell',
    params: {
      pipette: DEFAULT_PIPETTE,
      labware: TROUGH_LABWARE,
      well: 'B2',
      offset: { x: 2, y: 3, z: 10 },
      minimumZHeight: 35,
      forceDirect: true,
    },
  },
  {
    command: 'dropTip',
    params: {
      pipette: DEFAULT_PIPETTE,
      labware: 'trashId',
      well: 'A1',
    },
  },
  {
    command: 'updateRobotState',
    params: {
      labware: {
        tiprack1Id: { slot: '5' },
        [SOURCE_LABWARE]: { slot: '6' },
        [TROUGH_LABWARE]: { slot: 'magneticModuleId' },
      },
      modules: { temperatureModuleId: { slot: null } },
      tipState: {
        tipracks: { tiprack1Id: { A1: true, A2: false } },
        pipettes: { pipetteId: true },
      },
    },
  },
]

describe('createTimelineFromCommnds', () => {
  let invariantContext: InvariantContext
  let robotState: RobotState
  let flowRatesAndOffsets: { flowRate: number; offsetFromBottomMm: number }

  beforeEach(() => {
    invariantContext = makeContext()
    robotState = getInitialRobotStateStandard(invariantContext)
    flowRatesAndOffsets = {
      flowRate: 1.23,
      offsetFromBottomMm: 4.32,
    }
  })
  it('...', () => {
    const result = createTimelineFromCommands(
      commands,
      invariantContext,
      robotState
    )
    console.log(result)
    expect(result).toBeTruthy()
  })
})
