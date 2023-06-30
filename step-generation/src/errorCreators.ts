/** Utility fns to create reusable CommandCreatorErrors */
import type { CommandCreatorError } from './types'

// NOTE: in PD UI, the `message` key here is finally handled by ErrorContents component.
// To support step-generation as an independent library (someday), messages should also exist here
// for future programmatic use

export function insufficientTips(): CommandCreatorError {
  return {
    type: 'INSUFFICIENT_TIPS',
    message: 'Not enough tips to complete action',
  }
}

export function noTipOnPipette(args: {
  actionName: string
  pipette: string
  labware: string
  well: string
}): CommandCreatorError {
  const { actionName, pipette, labware, well } = args
  return {
    message: `Attempted to ${actionName} with no tip on pipette: ${pipette} from ${labware}'s well ${well}`,
    type: 'NO_TIP_ON_PIPETTE',
  }
}

export function pipetteDoesNotExist(args: {
  actionName: string
  pipette: string
}): CommandCreatorError {
  const { actionName, pipette } = args
  return {
    message: `Attempted to ${actionName} with pipette id "${pipette}", this pipette was not found under "pipettes"`,
    type: 'PIPETTE_DOES_NOT_EXIST',
  }
}

export function invalidSlot(args: {
  actionName: string
  slot: string
}): CommandCreatorError {
  const { actionName, slot } = args
  return {
    message: `Attempted to ${actionName} with slot "${slot}", this is not a valid slot"`,
    type: 'INVALID_SLOT',
  }
}

export function labwareDoesNotExist(args: {
  actionName: string
  labware: string
}): CommandCreatorError {
  const { actionName, labware } = args
  console.warn(
    `Attempted to ${actionName} with labware id "${labware}", this labware was not found under "labware"`
  )
  return {
    message: 'A step involves labware that has been deleted',
    type: 'LABWARE_DOES_NOT_EXIST',
  }
}

export function missingModuleError(): CommandCreatorError {
  return {
    message: 'This step requires a module, but none is selected',
    type: 'MISSING_MODULE',
  }
}

export function missingTemperatureStep(): CommandCreatorError {
  return {
    message:
      'This module is not changing temperature because it has either been deactivated or is already holding a temperature. In order to pause the protocol and wait for your module to reach a temperature, you must first use a Temperature step to tell the module to start changing to a new temperature',
    type: 'MISSING_TEMPERATURE_STEP',
  }
}

export function tipVolumeExceeded(args: {
  actionName: string
  volume: string | number
  maxVolume: string | number
}): CommandCreatorError {
  const { actionName, volume, maxVolume } = args
  return {
    message: `Attempted to ${actionName} volume greater than tip max volume (${volume} > ${maxVolume})`,
    type: 'TIP_VOLUME_EXCEEDED',
  }
}

export function pipetteVolumeExceeded(args: {
  actionName: string
  volume: string | number
  maxVolume: string | number
  disposalVolume?: string | number
}): CommandCreatorError {
  const { actionName, volume, maxVolume, disposalVolume } = args
  const message =
    disposalVolume != null
      ? `Attemped to ${actionName} volume + disposal volume greater than pipette max volume (${volume} + ${disposalVolume} > ${maxVolume})`
      : `Attempted to ${actionName} volume greater than pipette max volume (${volume} > ${maxVolume})`
  return {
    message,
    type: 'PIPETTE_VOLUME_EXCEEDED',
  }
}

export const modulePipetteCollisionDanger = (): CommandCreatorError => {
  return {
    type: 'MODULE_PIPETTE_COLLISION_DANGER',
    message:
      'Gen 1 8-Channel pipettes cannot access labware or tip racks in slot 4 or 6 because they are adjacent to modules.',
  }
}

export const thermocyclerLidClosed = (): CommandCreatorError => {
  return {
    type: 'THERMOCYCLER_LID_CLOSED',
    message:
      'Attempted to interact with contents of a thermocycler with the lid closed.',
  }
}

export const heaterShakerLatchOpen = (): CommandCreatorError => {
  return {
    type: 'HEATER_SHAKER_LATCH_OPEN',
    message:
      'Attempted to interact with contents of a heater-shaker with the latch open.',
  }
}

export const heaterShakerLatchClosed = (): CommandCreatorError => {
  return {
    type: 'HEATER_SHAKER_LATCH_CLOSED',
    message:
      'Attempted to move the contents of a heater-shaker with the latch closed.',
  }
}

export const heaterShakerIsShaking = (): CommandCreatorError => {
  return {
    type: 'HEATER_SHAKER_IS_SHAKING',
    message:
      'Attempted to interact with the contents of a heater-shaker when it is shaking.',
  }
}

export const tallLabwareEastWestOfHeaterShaker = (
  position: 'left' | 'right'
): CommandCreatorError => {
  return {
    type: 'TALL_LABWARE_EAST_WEST_OF_HEATER_SHAKER',
    message: `Labware over 53 mm is ${position} of this Heater-Shaker module.`,
  }
}

export const heaterShakerEastWestWithLatchOpen = (): CommandCreatorError => {
  return {
    type: 'HEATER_SHAKER_EAST_WEST_LATCH_OPEN',
    message: 'The Heater-Shaker labware latch is open',
  }
}

export const heaterShakerNorthSouthEastWestShaking = (): CommandCreatorError => {
  return {
    type: 'HEATER_SHAKER_NORTH_SOUTH_EAST_WEST_SHAKING',
    message: 'The Heater-Shaker is shaking',
  }
}

export const heaterShakerEastWestOfMultiChannelPipette = (): CommandCreatorError => {
  return {
    type: 'HEATER_SHAKER_EAST_WEST_MULTI_CHANNEL',
    message: 'The Heater-Shaker is shaking',
  }
}

export const heaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette = (): CommandCreatorError => {
  return {
    type: 'HEATER_SHAKER_NORTH_SOUTH__OF_NON_TIPRACK_WITH_MULTI_CHANNEL',
    message: '8-Channel pipette cannot access labware',
  }
}

export const labwareOffDeck = (): CommandCreatorError => {
  return {
    type: 'LABWARE_OFF_DECK',
    message: 'Attempted to interact with labware off deck',
  }
}
