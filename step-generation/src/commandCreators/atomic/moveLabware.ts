import {
  CreateCommand,
  HEATERSHAKER_MODULE_TYPE,
  LabwareMovementStrategy,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import * as errorCreators from '../../errorCreators'
import { uuid } from '../../utils'
import type {
  CommandCreator,
  CommandCreatorError,
  MoveLabwareArgs,
} from '../../types'
/** Move labware from one location to another, manually or via a gripper. */
export const moveLabware: CommandCreator<MoveLabwareArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { labware, useGripper, newLocation } = args
  const actionName = 'moveToLabware'
  const errors: CommandCreatorError[] = []

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware,
      })
    )
  }

  const initialLabwareSlot = prevRobotState.labware[labware]?.slot
  const initialModuleState =
    prevRobotState.modules[initialLabwareSlot]?.moduleState ?? null

  if (initialModuleState != null) {
    if (
      initialModuleState.type === THERMOCYCLER_MODULE_TYPE &&
      initialModuleState.lidOpen !== true
    ) {
      errors.push(errorCreators.thermocyclerLidClosed())
    } else if (initialModuleState.type === HEATERSHAKER_MODULE_TYPE) {
      if (initialModuleState.latchOpen === false) {
        errors.push(errorCreators.heaterShakerLatchClosed())
      } else if (initialModuleState.targetSpeed !== null) {
        errors.push(errorCreators.heaterShakerIsShaking())
      }
    }
  }
  const destModuleId =
    newLocation !== 'offDeck' && 'moduleId' in newLocation
      ? newLocation.moduleId
      : null

  if (destModuleId != null) {
    const destModuleState = prevRobotState.modules[destModuleId].moduleState
    if (
      destModuleState.type === THERMOCYCLER_MODULE_TYPE &&
      destModuleState.lidOpen !== true
    ) {
      errors.push(errorCreators.thermocyclerLidClosed())
    } else if (destModuleState.type === HEATERSHAKER_MODULE_TYPE) {
      if (destModuleState.latchOpen === false) {
        errors.push(errorCreators.heaterShakerLatchClosed())
      }
      if (destModuleState.targetSpeed !== null) {
        errors.push(errorCreators.heaterShakerIsShaking())
      }
    }
  }

  if (errors.length > 0) {
    return { errors }
  }

  const params = {
    labwareId: labware,
    strategy: useGripper
      ? 'usingGripper'
      : ('manualMoveWithPause' as LabwareMovementStrategy),
    newLocation,
  }

  const commands: CreateCommand[] = [
    {
      commandType: 'moveLabware',
      key: uuid(),
      params,
    },
  ]
  return {
    commands,
  }
}
