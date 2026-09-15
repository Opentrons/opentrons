/** Utility fns to create reusable CommandCreatorErrors */
import type { CommandCreatorError, UnsafePipetteMovementReason } from './types'

// NOTE: in PD UI, the `message` key here is finally handled by ErrorContents component.
// To support step-generation as an independent library (someday), messages should also exist here
// for future programmatic use

export function insufficientTips(): CommandCreatorError {
  return {
    type: 'INSUFFICIENT_TIPS',
    message: 'Not enough tips to complete action',
  }
}

export function missingAdapter(): CommandCreatorError {
  return {
    type: 'MISSING_96_CHANNEL_TIPRACK_ADAPTER',
    message: 'A 96-channel cannot pick up tips fully without an adapter',
  }
}

export function removeAdapter(): CommandCreatorError {
  return {
    type: 'REMOVE_96_CHANNEL_TIPRACK_ADAPTER',
    message: 'A 96-channel cannot pick up tips partially with an adapter',
  }
}

export function noTipOnPipette(args: {
  actionName: string
  pipette: string
  labware?: string
  well?: string
}): CommandCreatorError {
  const { actionName, pipette, labware, well } = args
  return {
    message:
      labware == null || well == null
        ? `Attempted to ${actionName} with no tip on pipette: ${pipette} in place`
        : `Attempted to ${actionName} with no tip on pipette: ${pipette} from ${labware}'s well ${well}`,
    type: 'NO_TIP_ON_PIPETTE',
  }
}

export function pipetteHasTip(): CommandCreatorError {
  return {
    message: 'One or more of the pipettes has a tip',
    type: 'PIPETTE_HAS_TIP',
  }
}

export function pipetteDoesNotExist(args: {
  pipette: string
}): CommandCreatorError {
  const { pipette } = args
  return {
    message: `This step tries to use the ${pipette}. Add the pipette to your protocol or change the step to use a different pipette.`,
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
    message: `This step tries to use ${labware}. Add the labware to your protocol or change the step to use a different labware.`,
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

export function missingProfileStep(): CommandCreatorError {
  return {
    message: 'This module is not currently running a profile.',
    type: 'MISSING_PROFILE_STEP',
  }
}

export function tipVolumeExceeded(args: {
  actionName: string
  volume: string | number
  maxVolume: string | number
}): CommandCreatorError {
  const { volume, maxVolume, actionName } = args
  return {
    message: `This step tries to ${actionName} ${volume}µL, but the tip can only hold ${maxVolume}µL.`,
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
      : `This step tries to ${actionName} ${volume}µL, but the tip can only hold ${maxVolume}µL.`
  return {
    message,
    type: 'PIPETTE_VOLUME_EXCEEDED',
  }
}

export const moveLocationNotSpecified = (): CommandCreatorError => {
  return {
    type: 'MOVE_LOCATION_NOT_SPECIFIED',
    message: 'This step is missing a move location.',
  }
}

export const modulePipetteCollisionDanger = (): CommandCreatorError => {
  return {
    type: 'MODULE_PIPETTE_COLLISION_DANGER',
    message:
      'Gen 1 8-Channel pipettes cannot access labware or tip racks in slot 4 or 6 because they are adjacent to modules.',
  }
}

export const thermocyclerBusyWithProfile = (): CommandCreatorError => {
  return {
    type: 'THERMOCYCLER_BUSY_WITH_PROFILE',
    message:
      'This step cannot run while the Thermocycler is running a profile. Move the step outside the profile.',
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

export const absorbanceReaderLidClosed = (): CommandCreatorError => {
  return {
    type: 'ABSORBANCE_READER_LID_CLOSED',
    message:
      'Attempted to interact with contents of an absorbance plate reader with the lid closed.',
  }
}

export const absorbanceReaderNoInitialization = (): CommandCreatorError => {
  return {
    type: 'ABSORBANCE_READER_NO_INITIALIZATION',
    message:
      'This step tries to read labware without initializing the Plate Reader first. Initialize the Plate Reader module or remove this step in order to proceed.',
  }
}

export const absorbanceReaderNoGripper = (): CommandCreatorError => {
  return {
    type: 'ABSORBANCE_READER_NO_GRIPPER',
    message:
      'This step involves opening or closing the Absorbance Plate Reader lid with a gripper. Add a gripper or remove step to proceed.',
  }
}

export const flexStackerNoGripper = (): CommandCreatorError => {
  return {
    type: 'FLEX_STACKER_NO_GRIPPER',
    message:
      'This step involves a gripper. Add a gripper or remove step to proceed.',
  }
}

export const flexStackerHopperEmpty = (): CommandCreatorError => {
  return {
    type: 'HOPPER_EMPTY',
    message: 'Cannot retrieve labware from empty stacker',
  }
}

export const flexStackerShuttleFull = (): CommandCreatorError => {
  return {
    type: 'SHUTTLE_FULL',
    message:
      'Shuttle must be empty in order to retrieve labware from the stacker',
  }
}

export const flexStackerShuttleEmpty = (): CommandCreatorError => {
  return {
    type: 'SHUTTLE_EMPTY',
    message: 'Shuttle must have labware in order to store it in the stacker',
  }
}

export const flexStackerLabwareTypeMismatch = (): CommandCreatorError => {
  return {
    type: 'MISMATCHED_STACKER_LABWARE_TYPE',
    message: 'The stacker can only store a single type of labware at a time',
  }
}

export const flexStackerLabwareTypeMissing = (): CommandCreatorError => {
  return {
    type: 'MISSING_STACKER_LABWARE_TYPE',
    message:
      'Add labware to the stacker in the starting deck so that you can refill it later',
  }
}

export const flexStackerHopperFull = (): CommandCreatorError => {
  return {
    type: 'HOPPER_FULL',
    message: 'The hopper has reached capacity',
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

export const possiblePipetteCollision = (args: {
  unsafePipetteMovementReason: UnsafePipetteMovementReason
}): CommandCreatorError => {
  const { unsafePipetteMovementReason } = args

  switch (unsafePipetteMovementReason.type) {
    case 'thermocyclerLidCollision':
      return {
        type: 'POSSIBLE_PIPETTE_COLLISION_THERMOCYCLER_LID',
        message:
          'There is a possibility that the Pipette will collide with the Thermocycler lid',
      }
    case 'outsidePipetteExtents':
      return {
        type: 'POSSIBLE_PIPETTE_COLLISION_OUTSIDE_DECK_EXTENTS',
        message:
          'There is a possibility that the pipette will move outside the deck extents.',
      }
    case 'adjacentAdressableAreaCollision':
      return {
        type: 'POSSIBLE_PIPETTE_COLLISION_ADJACENT_ADDRESSABLE_AREA',
        message: `There is a possibility that the pipette will collide with adjacent items in ${unsafePipetteMovementReason.addressableAreaCausingCollision.displayName}`,
        translationParams: {
          addressableAreaCausingCollisionDisplayName:
            unsafePipetteMovementReason.addressableAreaCausingCollision
              .displayName,
        },
      }
  }
}

export const heaterShakerEastWestWithLatchOpen = (): CommandCreatorError => {
  return {
    type: 'HEATER_SHAKER_EAST_WEST_LATCH_OPEN',
    message: 'The Heater-Shaker labware latch is open',
  }
}

export const heaterShakerNorthSouthEastWestShaking =
  (): CommandCreatorError => {
    return {
      type: 'HEATER_SHAKER_NORTH_SOUTH_EAST_WEST_SHAKING',
      message: 'The Heater-Shaker is shaking',
    }
  }

export const heaterShakerEastWestOfMultiChannelPipette =
  (): CommandCreatorError => {
    return {
      type: 'HEATER_SHAKER_EAST_WEST_MULTI_CHANNEL',
      message: 'The Heater-Shaker is shaking',
    }
  }

export const heaterShakerNorthSouthOfNonTiprackWithMultiChannelPipette =
  (): CommandCreatorError => {
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

export const multipleEntitiesOnSameSlotName = (): CommandCreatorError => {
  return {
    type: 'LABWARE_ON_ANOTHER_ENTITY',
    message:
      'Attempted to move labware onto another entity with the same slotName',
  }
}

export const dropTipLocationDoesNotExist = (): CommandCreatorError => {
  return {
    type: 'DROP_TIP_LOCATION_DOES_NOT_EXIST',
    message: 'The destination for dropping tip does not exist',
  }
}

export const equipmentDoesNotExist = (): CommandCreatorError => {
  return {
    type: 'EQUIPMENT_DOES_NOT_EXIST',
    message: `Equipment does not exist.`,
  }
}

export const gripperRequired = (): CommandCreatorError => {
  return {
    type: 'GRIPPER_REQUIRED',
    message: 'The gripper is required to fulfill this action',
  }
}

export const pipettingIntoColumn4 = (args: {
  typeOfStep: string
}): CommandCreatorError => {
  return {
    type: 'PIPETTING_INTO_COLUMN_4',
    message: `Cannot ${args.typeOfStep} into a column 4 slot.`,
  }
}

export const cannotMoveWithGripper = (): CommandCreatorError => {
  return {
    type: 'CANNOT_MOVE_WITH_GRIPPER',
    message: 'The gripper cannot move aluminum blocks',
  }
}

export const noTipSelected = (): CommandCreatorError => {
  return {
    type: 'NO_TIP_SELECTED',
    message: 'No tips were selected for this step',
  }
}

export const labwareDiscarded = (): CommandCreatorError => {
  return {
    type: 'LABWARE_DISCARDED_IN_TRASH',
    message: 'The labware was discarded in trash in a previous step.',
  }
}

export const submergeBelowAspirate = (): CommandCreatorError => {
  return {
    type: 'SUBMERGE_BELOW_ASPIRATE',
    message: 'The submerge position must be above the aspirate position',
  }
}

export const retractBelowAspirate = (): CommandCreatorError => {
  return {
    type: 'RETRACT_BELOW_ASPIRATE',
    message: 'The retract position must be above the aspirate position',
  }
}

export const submergeBelowDispense = (): CommandCreatorError => {
  return {
    type: 'SUBMERGE_BELOW_DISPENSE',
    message: 'The submerge position must be above the dispense position',
  }
}

export const retractBelowDispense = (): CommandCreatorError => {
  return {
    type: 'RETRACT_BELOW_DISPENSE',
    message: 'The retract position must be above the dispense position',
  }
}

export const multiAspirateVolumeTooHigh = (): CommandCreatorError => {
  return {
    type: 'MULTI_ASPIRATE_VOLUME_TOO_HIGH',
    message:
      'Consolidate pipette path was selected but cannot fit volume for more than 1 well in the tip',
  }
}

export const multiDispenseVolumeTooHigh = (): CommandCreatorError => {
  return {
    type: 'MULTI_DISPENSE_VOLUME_TOO_HIGH',
    message:
      'Distribute pipette path was selected but cannot fit volume for more than 1 well in the tip',
  }
}

export const closingThermocyclerWithInvalidLid = (args: {
  lidDisplayName: string
}): CommandCreatorError => {
  return {
    type: 'CLOSING_THERMOCYCLER_WITH_INVALID_LABWARE_LID',
    message: `Closing the Thermocycler lid with ${args.lidDisplayName} in place will cause damage`,
  }
}

export const returnTipUnavailable = (): CommandCreatorError => {
  return {
    type: 'RETURN_TIP_UNAVAILABLE',
    message: 'Current tip does not have a known location to return to',
  }
}

export const tipRackLidNotAllowedOnDeck = (): CommandCreatorError => {
  return {
    type: 'TIPRACK_LID_NOT_ALLOWED_ON_DECK',
    message: 'The tip rack lid is not supported directly on the deck',
  }
}

export const nextTiprackHasLid = (): CommandCreatorError => {
  return {
    type: 'NEXT_TIPRACK_HAS_LID',
    message: 'A pipette cannot pick up tips from a tip rack with a lid',
  }
}

export const stackTooHigh = (args: { slot: string }): CommandCreatorError => {
  return {
    type: 'STACK_TOO_HIGH',
    message: `The stack on slot ${args.slot} is too high`,
  }
}

export const tooManyTips = (): CommandCreatorError => {
  return {
    type: 'TOO_MANY_TIPS',
    message: 'Action will pick up too many tips',
  }
}

export const incompletePickup = (): CommandCreatorError => {
  return {
    type: 'INCOMPLETE_PICKUP',
    message: 'At least one of the selected tips is empty',
  }
}

export const labwareOnHopper = (): CommandCreatorError => {
  return {
    type: 'LABWARE_ON_HOPPER',
    message: 'Labware cannot be moved from the Flex Stacker Hopper',
  }
}

export const missingPumpActivity = (): CommandCreatorError => {
  return {
    type: 'MISSING_PUMP_ACTIVITY',
    message: 'This module is not currently running a pump activity.',
  }
}

export const invalidWaitCondition = (
  waitCondition: string
): CommandCreatorError => {
  return {
    type: 'INVALID_WAIT_CONDITION',
    message: `Invalid wait condition: ${waitCondition}`,
  }
}

export const liveTaskError = (): CommandCreatorError => {
  return {
    type: 'LIVE_TASK_ERROR',
    message:
      'This module is currently running a live task. Please wait for it to complete before performing this action.',
  }
}

export const vacuumUnderPressure = (): CommandCreatorError => {
  return {
    type: 'VACUUM_UNDER_PRESSURE',
    message:
      'The vacuum module is under pressure. Deactivate the pump to move labware to or from it.',
  }
}
