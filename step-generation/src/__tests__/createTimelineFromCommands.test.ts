import { createTimelineFromCommands } from '../utils/createTimelineFromCommands'
import { makeInitialRobotState } from '../utils/misc'
import {
  makeContext,
  DEFAULT_PIPETTE,
  SOURCE_LABWARE,
  TROUGH_LABWARE,
} from '../fixtures'

import { Command, InvariantContext } from '../types'

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
]

describe('createTimelineFromCommnds', () => {
  let invariantContext: InvariantContext

  beforeEach(() => {
    invariantContext = makeContext()
  })
  it('...', () => {
    const result = createTimelineFromCommands(commands, invariantContext)
    expect(result).toBeTruthy()
  })
})
