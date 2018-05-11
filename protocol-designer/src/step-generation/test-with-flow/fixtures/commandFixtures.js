// @flow
import {tiprackWellNamesFlat} from '../../data'
import type {Command} from '../../types'

export const replaceTipCommands = (tiprackTipIdx: number): Array<Command> => [
  {
    command: 'drop-tip',
    params: {
      pipette: 'p300SingleId',
      labware: 'trashId',
      well: 'A1'
    }
  },
  {
    command: 'pick-up-tip',
    params: {
      pipette: 'p300SingleId',
      labware: 'tiprack1Id',
      well: tiprackWellNamesFlat[tiprackTipIdx]
    }
  }
]

export const touchTip = (well: string): Command => ({
  command: 'touch-tip',
  params: {
    labware: 'sourcePlateId',
    pipette: 'p300SingleId',
    well
  }
})

export const aspirate = (well: string, volume: number): Command => ({
  command: 'aspirate',
  params: {
    pipette: 'p300SingleId',
    labware: 'sourcePlateId',
    volume,
    well
  }
})

export const dispense = (well: string, volume: number): Command => ({
  command: 'dispense',
  params: {
    pipette: 'p300SingleId',
    labware: 'sourcePlateId',
    volume,
    well
  }
})

export const blowout = (labware: string): Command => ({
  command: 'blowout',
  params: {
    pipette: 'p300SingleId',
    well: 'A1',
    labware
  }
})
