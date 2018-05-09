// @flow
/** Utility fns to create reusable CommandCreatorErrors */
import type {CommandCreatorError} from './types'

export function insufficientTips (): CommandCreatorError {
  return {
    type: 'INSUFFICIENT_TIPS',
    message: 'Not enough tips to complete action'
  }
}

export function noTipOnPipette (args: {
  actionName: string,
  pipette: string,
  labware: string,
  well: string
}): CommandCreatorError {
  const {actionName, pipette, labware, well} = args
  return {
    message: `Attempted to ${actionName} with no tip on pipette: ${pipette} from ${labware}'s well ${well}`,
    type: 'NO_TIP_ON_PIPETTE'
  }
}

export function pipetteDoesNotExist (args: {actionName: string, pipette: string}): CommandCreatorError {
  const {actionName, pipette} = args
  return {
    message: `Attempted to ${actionName} with pipette id "${pipette}", this pipette was not found under "instruments"`,
    type: 'PIPETTE_DOES_NOT_EXIST'
  }
}

export function labwareDoesNotExist (args: {actionName: string, labware: string}): CommandCreatorError {
  const {actionName, labware} = args
  return {
    message: `Attempted to ${actionName} with labware id "${labware}", this labware was not found under "labware"`,
    type: 'LABWARE_DOES_NOT_EXIST'
  }
}

export function pipetteVolumeExceeded (args: {
  actionName: string,
  volume: string | number,
  maxVolume: string | number
}): CommandCreatorError {
  const {actionName, volume, maxVolume} = args
  return {
    message: `Attempted to ${actionName} volume greater than pipette max volume (${volume} > ${maxVolume})`,
    type: 'PIPETTE_VOLUME_EXCEEDED'
  }
}
