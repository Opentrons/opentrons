// @flow
import flatMap from 'lodash/flatMap'
import aspirate from './aspirate'
import blowout from './blowout'
import dispense from './dispense'
import replaceTip from './replaceTip'
import touchTip from './touchTip'
import {repeatArray, reduceCommandCreators} from './utils'
import * as errorCreators from './errorCreators'
import type {MixFormData, RobotState, CommandCreator} from './'

/** Helper fn to make mix command creators w/ minimal arguments */
export function mixUtil (
  pipette: string,
  labware: string,
  well: string,
  volume: number,
  times: number,
  aspirateOffsetFromBottomMm?: ?number,
  dispenseOffsetFromBottomMm?: ?number
): Array<CommandCreator> {
  return repeatArray([
    aspirate({pipette, volume, labware, well, offsetFromBottomMm: aspirateOffsetFromBottomMm}),
    dispense({pipette, volume, labware, well, offsetFromBottomMm: dispenseOffsetFromBottomMm})
  ], times)
}

const mix = (data: MixFormData): CommandCreator => (prevRobotState: RobotState) => {
  /**
    Mix will aspirate and dispense a uniform volume some amount of times from a set of wells
    in a single labware.

    =====

    For mix, changeTip means:
    * 'always': before the first aspirate in each well, get a fresh tip
    * 'once': get a new tip at the beginning of the overall mix step, and use it throughout for all wells
    * 'never': reuse the tip from the last step
  */
  const actionName = 'mix'
  const {
    pipette,
    labware,
    wells,
    volume,
    times,
    changeTip,
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm
  } = data

  // Errors
  if (!prevRobotState.instruments[pipette]) {
    // bail out before doing anything else
    return {
      errors: [errorCreators.pipetteDoesNotExist({actionName, pipette})]
    }
  }

  if (!prevRobotState.labware[labware]) {
    return {
      errors: [errorCreators.labwareDoesNotExist({actionName, labware})]
    }
  }

  // Command generation
  const commandCreators = flatMap(
    wells,
    (well: string, wellIndex: number): Array<CommandCreator> => {
      let tipCommands: Array<CommandCreator> = []

      if (
        changeTip === 'always' ||
        (changeTip === 'once' && wellIndex === 0)
      ) {
        tipCommands = [replaceTip(pipette)]
      }

      const touchTipCommands = data.touchTip
      ? [touchTip({pipette, labware, well})]
      : []

      const blowoutCommands = data.blowout
      ? [blowout({
        pipette,
        labware: data.blowout,
        well: 'A1'
      })]
      : []

      const mixCommands = mixUtil(
        pipette,
        labware,
        well,
        volume,
        times,
        aspirateOffsetFromBottomMm,
        dispenseOffsetFromBottomMm
      )

      return [
        ...tipCommands,
        ...mixCommands,
        ...blowoutCommands,
        ...touchTipCommands
      ]
    }
  )

  return reduceCommandCreators(commandCreators)(prevRobotState)
}

export default mix
