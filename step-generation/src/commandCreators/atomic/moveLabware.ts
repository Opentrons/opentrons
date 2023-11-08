import {
  CreateCommand,
  HEATERSHAKER_MODULE_TYPE,
  LabwareMovementStrategy,
  THERMOCYCLER_MODULE_TYPE,
  WASTE_CHUTE_SLOT,
} from '@opentrons/shared-data'
import * as errorCreators from '../../errorCreators'
import * as warningCreators from '../../warningCreators'
import {
  getHasWasteChute,
  getTiprackHasTips,
  getLabwareHasLiquid,
  uuid,
} from '../../utils'
import type {
  CommandCreator,
  CommandCreatorError,
  MoveLabwareArgs,
  CommandCreatorWarning,
} from '../../types'

/** Move labware from one location to another, manually or via a gripper. */
export const moveLabware: CommandCreator<MoveLabwareArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const { labware, useGripper, newLocation } = args
  const { additionalEquipmentEntities } = invariantContext
  const tiprackHasTip =
    prevRobotState.tipState != null
      ? getTiprackHasTips(prevRobotState.tipState, labware)
      : false
  const labwareHasLiquid =
    prevRobotState.liquidState != null
      ? getLabwareHasLiquid(prevRobotState.liquidState, labware)
      : false

  const actionName = 'moveToLabware'
  const errors: CommandCreatorError[] = []
  const warnings: CommandCreatorWarning[] = []

  const newLocationInWasteChute =
    newLocation !== 'offDeck' &&
    'slotName' in newLocation &&
    newLocation.slotName === WASTE_CHUTE_SLOT

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

  const destModuleOrSlotUnderAdapterId =
    destAdapterId != null ? prevRobotState.labware[destAdapterId].slot : null
  const destinationModuleIdOrSlot =
    destModuleOrSlotUnderAdapterId != null
      ? destModuleOrSlotUnderAdapterId
      : destModuleId

  if (newLocation === 'offDeck' && useGripper) {
    errors.push(errorCreators.labwareOffDeck())
  }

  if (
    tiprackHasTip &&
    newLocationInWasteChute &&
    getHasWasteChute(additionalEquipmentEntities)
  ) {
    warnings.push(warningCreators.tiprackInWasteChuteHasTips())
  } else if (
    labwareHasLiquid &&
    newLocationInWasteChute &&
    getHasWasteChute(additionalEquipmentEntities)
  ) {
    warnings.push(warningCreators.labwareInWasteChuteHasLiquid())
  }

  if (
    destinationModuleIdOrSlot != null &&
    prevRobotState.modules[destinationModuleIdOrSlot] != null
  ) {
    const destModuleState =
      prevRobotState.modules[destinationModuleIdOrSlot].moduleState

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
