// @flow
import { tiprackWellNamesFlat } from './data'
import type {
  AspirateDispenseArgsV1 as AspirateDispenseArgs,
  CommandV1 as Command,
} from '@opentrons/shared-data'

export const replaceTipCommands = (tip: number | string): Array<Command> => [
  dropTip('A1'),
  pickUpTip(tip),
]

export const dropTip = (
  well: string,
  params?: {| pipette?: string, labware?: string |}
): Command => ({
  command: 'drop-tip',
  params: {
    pipette: 'p300SingleId',
    labware: 'trashId',
    well: typeof well === 'string' ? well : tiprackWellNamesFlat[well],
    ...params,
  },
})

export const pickUpTip = (
  tip: number | string,
  params?: {| pipette?: string, labware?: string |}
): Command => ({
  command: 'pick-up-tip',
  params: {
    pipette: 'p300SingleId',
    labware: 'tiprack1Id',
    ...params,
    well: typeof tip === 'string' ? tip : tiprackWellNamesFlat[tip],
  },
})

export const touchTip = (
  well: string,
  params?: {| labware?: string |}
): Command => ({
  command: 'touch-tip',
  params: {
    labware: 'sourcePlateId',
    pipette: 'p300SingleId',
    ...params,
    well,
  },
})

export const aspirate = (
  well: string,
  volume: number,
  params?: $Shape<AspirateDispenseArgs>
): Command => ({
  command: 'aspirate',
  params: {
    pipette: 'p300SingleId',
    labware: 'sourcePlateId',
    ...params,
    volume,
    well,
  },
})

export const dispense = (
  well: string,
  volume: number,
  params?: $Shape<AspirateDispenseArgs>
): Command => ({
  command: 'dispense',
  params: {
    pipette: 'p300SingleId',
    labware: 'sourcePlateId',
    ...params,
    volume,
    well,
  },
})

export const blowout = (
  labware?: string,
  params?: {| pipette?: string, well?: string |}
): Command => ({
  command: 'blowout',
  params: {
    pipette: 'p300SingleId',
    well: 'A1',
    labware: labware || 'trashId',
    ...params,
  },
})
