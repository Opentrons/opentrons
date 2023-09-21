import {
  CreateCommand,
  HEATERSHAKER_MODULE_TYPE,
  LabwareMovementStrategy,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import * as errorCreators from '../../errorCreators'
import * as warningCreators from '../../warningCreators'
import { uuid } from '../../utils'
import type {
  CommandCreator,
  CommandCreatorError,
  MoveLabwareArgs,
} from '../../types'
import { CommandCreatorWarning } from '../..'
/** Move labware from one location to another, manually or via a gripper. */
export const moveLabware: CommandCreator<MoveLabwareArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { labware, useGripper, newLocation } = args
  const { tipState } = prevRobotState

  const { additionalEquipmentEntities } = invariantContext

  const actionName = 'moveToLabware'
  const errors: CommandCreatorError[] = []
  const warnings: CommandCreatorWarning[] = []

  const tiprackHasTip =
    tipState.tipracks[labware] != null
      ? Object.values(tipState.tipracks[labware]).some(value => value === true)
      : false

  if (!labware || !prevRobotState.labware[labware]) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware,
      })
    )
  } else if (prevRobotState.labware[labware].slot === 'offDeck' && useGripper) {
    errors.push(errorCreators.labwareOffDeck())
  }

  const initialLabwareSlot = prevRobotState.labware[labware]?.slot
  const initialAdapterSlot = prevRobotState.labware[initialLabwareSlot]?.slot
  const initialSlot =
    initialAdapterSlot != null ? initialAdapterSlot : initialLabwareSlot

  const initialModuleState =
    prevRobotState.modules[initialSlot]?.moduleState ?? null
  if (initialModuleState != null) {
    if (
      initialModuleState.type === THERMOCYCLER_MODULE_TYPE &&
      initialModuleState.lidOpen !== true
    ) {
      errors.push(errorCreators.thermocyclerLidClosed())
    } else if (initialModuleState.type === HEATERSHAKER_MODULE_TYPE) {
      if (initialModuleState.latchOpen !== true) {
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

  const destAdapterId =
    newLocation !== 'offDeck' && 'labwareId' in newLocation
      ? newLocation.labwareId
      : null
  const destModuleIdUnderAdapter =
    destAdapterId != null ? prevRobotState.labware[destAdapterId].slot : null
  const destinationModuleId =
    destModuleIdUnderAdapter != null ? destModuleIdUnderAdapter : destModuleId

  if (newLocation === 'offDeck' && useGripper) {
    errors.push(errorCreators.labwareOffDeck())
  }
  if (
    tiprackHasTip &&
    newLocation !== 'offDeck' &&
    'labwareId' in newLocation &&
    newLocation.labwareId === WASTE_CHUTE_SLOT
  ) {
    warnings.push(warningCreators.tiprackInWasteChuteHasTips())
  }
  if (destinationModuleId != null) {
    const destModuleState =
      prevRobotState.modules[destinationModuleId].moduleState
    if (
      destModuleState.type === THERMOCYCLER_MODULE_TYPE &&
      destModuleState.lidOpen !== true
    ) {
      errors.push(errorCreators.thermocyclerLidClosed())
    } else if (destModuleState.type === HEATERSHAKER_MODULE_TYPE) {
      if (destModuleState.latchOpen !== true) {
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
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}
