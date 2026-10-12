import {
  ABSORBANCE_READER_TYPE,
  FLEX_ROBOT_TYPE,
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  getIsLid,
  HEATERSHAKER_MODULE_TYPE,
  locationIsOnAddressableArea,
  locationIsOnDeck,
  locationIsOnLabware,
  locationIsOnModule,
  MOVABLE_TRASH_ADDRESSABLE_AREAS,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  VACUUM_MODULE_TYPE,
  WASTE_CHUTE_ADDRESSABLE_AREAS,
} from '@opentrons/shared-data'

import { COLUMN_4_SLOTS, HOPPER_STACKER_LOCATION } from '../../constants'
import * as errorCreators from '../../errorCreators'
import {
  formatPyStr,
  getCutoutIdByAddressableArea,
  getIsLabwareCompatibleWithStack,
  getIsSlotAVacuumDock,
  getLabwareHasLiquid,
  getLargestStackInSlot,
  getNearestParentInStack,
  getSlotInLocationStack,
  getTiprackHasTips,
  OFF_DECK,
  PROTOCOL_CONTEXT_NAME,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'
import * as warningCreators from '../../warningCreators'

import type {
  AddressableAreaName,
  CreateCommand,
  CutoutId,
  LabwareLocation,
  MoveLabwareParams,
} from '@opentrons/shared-data'
import type {
  CommandCreator,
  CommandCreatorError,
  CommandCreatorWarning,
  ModuleState,
  MoveLabwareStepGenArgs,
} from '../../types'

export const TIPRACK_LID_LOADNAME = 'opentrons_flex_tiprack_lid'

/** Move labware from one location to another, manually or via a gripper. */
export const moveLabware: CommandCreator<MoveLabwareStepGenArgs> = (
  args,
  invariantContext,
  prevRobotState
) => {
  const {
    gripperEntities,
    trashBinEntities,
    wasteChuteEntities,
    labwareEntities,
    moduleEntities,
    runtimeParameters,
  } = invariantContext
  const labwareId = resolveStringRuntimeValue(args.labwareId, runtimeParameters)
  const strategy = resolveStringRuntimeValue(args.strategy, runtimeParameters)
  const errors: CommandCreatorError[] = []
  let newLocation: LabwareLocation | null = null
  if (labwareId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.labwareId })
    )
  }
  if (strategy == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.strategy })
    )
  }
  if (typeof args.newLocation === 'string') {
    const resolvedLocation = resolveStringRuntimeValue(
      args.newLocation,
      runtimeParameters
    )
    if (resolvedLocation == null) {
      errors.push(
        errorCreators.invalidRuntimeParameter({
          parameterName: args.newLocation,
        })
      )
    } else {
      newLocation = resolvedLocation as LabwareLocation
    }
  } else if ('labwareId' in args.newLocation) {
    const destLabwareId = resolveStringRuntimeValue(
      args.newLocation.labwareId,
      runtimeParameters
    )
    if (destLabwareId == null) {
      errors.push(
        errorCreators.invalidRuntimeParameter({
          parameterName: args.newLocation.labwareId,
        })
      )
    } else {
      newLocation = { labwareId: destLabwareId }
    }
  } else if ('moduleId' in args.newLocation) {
    const moduleId = resolveStringRuntimeValue(
      args.newLocation.moduleId,
      runtimeParameters
    )
    if (moduleId == null) {
      errors.push(
        errorCreators.invalidRuntimeParameter({
          parameterName: args.newLocation.moduleId,
        })
      )
    } else {
      newLocation = { moduleId }
    }
  } else if ('slotName' in args.newLocation) {
    const slotName = resolveStringRuntimeValue(
      args.newLocation.slotName,
      runtimeParameters
    )
    if (slotName == null) {
      errors.push(
        errorCreators.invalidRuntimeParameter({
          parameterName: args.newLocation.slotName,
        })
      )
    } else {
      newLocation = { slotName }
    }
  } else {
    const addressableAreaName = resolveStringRuntimeValue(
      args.newLocation.addressableAreaName,
      runtimeParameters
    )
    if (addressableAreaName == null) {
      errors.push(
        errorCreators.invalidRuntimeParameter({
          parameterName: args.newLocation.addressableAreaName,
        })
      )
    } else {
      newLocation = {
        addressableAreaName: addressableAreaName as AddressableAreaName,
      }
    }
  }
  if (
    errors.length > 0 ||
    labwareId == null ||
    strategy == null ||
    newLocation == null
  ) {
    return { errors }
  }
  const useGripper = strategy === 'usingGripper'
  const hasGripperEntity = Object.keys(gripperEntities).length > 0
  const hasWasteChute = Object.values(wasteChuteEntities).length > 0
  const tiprackHasTip =
    prevRobotState.tipState != null
      ? getTiprackHasTips(prevRobotState.tipState, labwareId)
      : false
  const labwareHasLiquid =
    prevRobotState.liquidState != null
      ? getLabwareHasLiquid(prevRobotState.liquidState, labwareId)
      : false
  const hasTipOnPipettes = Object.values(prevRobotState.tipState.pipettes).some(
    ({ hasTip }) => hasTip
  )
  const actionName = 'moveToLabware'
  const warnings: CommandCreatorWarning[] = []

  const newLocationInWasteChute =
    locationIsOnAddressableArea(newLocation) &&
    newLocation.addressableAreaName === 'gripperWasteChute'

  if (!labwareId || !prevRobotState.labware[labwareId]) {
    errors.push(
      errorCreators.labwareDoesNotExist({
        actionName,
        labware: labwareId,
      })
    )
  } else if (
    getSlotInLocationStack(prevRobotState.labware[labwareId].stack) ===
      'offDeck' &&
    useGripper
  ) {
    errors.push(errorCreators.labwareOffDeck())
  } else if (
    prevRobotState.labware[labwareId].stack.includes(HOPPER_STACKER_LOCATION)
  ) {
    errors.push(errorCreators.labwareOnHopper())
  }

  const isAluminumBlock =
    labwareEntities[labwareId]?.def.metadata.displayCategory === 'aluminumBlock'

  if (useGripper && isAluminumBlock) {
    errors.push(errorCreators.cannotMoveWithGripper())
  }

  if (
    (newLocationInWasteChute && hasGripperEntity && !useGripper) ||
    (!hasGripperEntity && useGripper)
  ) {
    errors.push(errorCreators.gripperRequired())
  }

  if (hasTipOnPipettes && useGripper) {
    errors.push(errorCreators.pipetteHasTip())
  }

  const initialLabwareSlot =
    prevRobotState.labware[labwareId] != null
      ? getSlotInLocationStack(prevRobotState.labware[labwareId].stack)
      : null

  if (
    (hasWasteChute && initialLabwareSlot === 'gripperWasteChute') ||
    MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(
      initialLabwareSlot as AddressableAreaName
    ) ||
    initialLabwareSlot === 'fixedTrash'
  ) {
    errors.push(errorCreators.labwareDiscarded())
  }
  const initialAdapterSlot =
    initialLabwareSlot != null &&
    prevRobotState.labware[initialLabwareSlot] != null
      ? getSlotInLocationStack(prevRobotState.labware[initialLabwareSlot].stack)
      : null
  const initialSlot =
    initialAdapterSlot != null ? initialAdapterSlot : initialLabwareSlot

  const getModuleStateFromSlotOrId = (
    identifier: string | null
  ): ModuleState | null => {
    if (identifier == null) {
      return null
    } else if (identifier in prevRobotState.modules) {
      // identifier is a module id
      return prevRobotState.modules[identifier].moduleState
    } else {
      // identifier is a slot name
      return (
        Object.values(prevRobotState.modules).find(
          ({ slot }) => slot === identifier
        )?.moduleState ?? null
      )
    }
  }
  const labwareWithOffdeck = Object.entries(prevRobotState.labware)
    .filter(([_, labware]) => labware.stack.includes('offDeck'))
    .map(([labwareId]) => labwareId)
  const newLocationList = Object.values(newLocation)

  if (
    labwareWithOffdeck.some(item => newLocationList.includes(item)) &&
    useGripper
  ) {
    errors.push(errorCreators.moveLocationNotSpecified())
  }
  const initialModuleState = getModuleStateFromSlotOrId(initialSlot)
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
    } else if (
      initialModuleState.type === ABSORBANCE_READER_TYPE &&
      initialModuleState.lidOpen !== true
    ) {
      errors.push(errorCreators.absorbanceReaderLidClosed())
    } else if (
      initialModuleState.type === VACUUM_MODULE_TYPE &&
      initialModuleState.currentPumpActivity.type !== 'pumpDeactivated'
    ) {
      errors.push(errorCreators.vacuumUnderPressure())
    }
  }
  const destModuleId =
    locationIsOnModule(newLocation) && 'moduleId' in newLocation
      ? newLocation.moduleId
      : null

  const destAdapterId = locationIsOnLabware(newLocation)
    ? newLocation.labwareId
    : null

  const destModuleOrSlotUnderAdapterId =
    destAdapterId != null
      ? prevRobotState.labware[destAdapterId].stack[1]
      : null
  const destinationModuleIdOrSlot =
    destModuleOrSlotUnderAdapterId != null
      ? destModuleOrSlotUnderAdapterId
      : destModuleId

  if (newLocation === 'offDeck' && useGripper) {
    errors.push(errorCreators.labwareOffDeck())
  }

  if (tiprackHasTip && newLocationInWasteChute && hasWasteChute) {
    warnings.push(warningCreators.tiprackInWasteChuteHasTips())
  } else if (labwareHasLiquid && newLocationInWasteChute && hasWasteChute) {
    warnings.push(warningCreators.labwareInWasteChuteHasLiquid())
  }

  const destModuleState = getModuleStateFromSlotOrId(destinationModuleIdOrSlot)
  if (destModuleState != null) {
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
    } else if (destModuleState.type === ABSORBANCE_READER_TYPE) {
      if (destModuleState.lidOpen !== true) {
        errors.push(errorCreators.absorbanceReaderLidClosed())
      }
    } else if (
      destModuleState.type === VACUUM_MODULE_TYPE &&
      destModuleState.currentPumpActivity.type !== 'pumpDeactivated'
    ) {
      errors.push(errorCreators.vacuumUnderPressure())
    }
  }
  const isLabwareIdATiprackLid =
    labwareEntities[labwareId]?.def.parameters.loadName === TIPRACK_LID_LOADNAME
  if (
    isLabwareIdATiprackLid &&
    newLocation != null &&
    locationIsOnDeck(newLocation) &&
    ('slotName' in newLocation ||
      ('addressableAreaName' in newLocation &&
        FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS.includes(
          newLocation.addressableAreaName as AddressableAreaName
        )))
  ) {
    errors.push(errorCreators.tipRackLidNotAllowedOnDeck())
  }

  const params = {
    labwareId,
    strategy: strategy as MoveLabwareParams['strategy'],
    newLocation,
  }
  const commands: CreateCommand[] = [
    {
      commandType: 'moveLabware',
      key: uuid(),
      params,
    },
  ]

  // null protect if labware to move has been deleted
  const labwarePythonName = labwareEntities[labwareId]?.pythonName
  let location: string = ''
  let parentSlotForSlotCompatibility: string | null = null
  if (newLocation === 'offDeck') {
    location = OFF_DECK
  } else if (newLocation === 'systemLocation') {
    location = 'system_location' // NOTE: i think this is for LPC but shouldn't be used in PD
  } else if (newLocation === 'wasteChuteLocation') {
    location = OFF_DECK // NOTE: this should never happen; labware should only be here if moved
    // to the waste chute
  } else if ('labwareId' in newLocation) {
    location = labwareEntities[newLocation.labwareId].pythonName
    const newLocationStack = prevRobotState.labware[newLocation.labwareId].stack
    parentSlotForSlotCompatibility =
      newLocationStack[newLocationStack.length - 1]
  } else if ('moduleId' in newLocation) {
    parentSlotForSlotCompatibility =
      prevRobotState.modules[newLocation.moduleId].slot
    location = moduleEntities[newLocation.moduleId].pythonName
  } else if ('slotName' in newLocation) {
    const { slotName } = newLocation
    if (slotName in labwareEntities) {
      const slot = getSlotInLocationStack(
        prevRobotState.labware[slotName].stack
      )
      const isParentLid = getIsLid(labwareEntities[slotName].def)
      location = isParentLid
        ? formatPyStr(slot)
        : labwareEntities[slotName].pythonName
      const newLocationStack = prevRobotState.labware[slotName].stack
      parentSlotForSlotCompatibility =
        newLocationStack[newLocationStack.length - 1]
    } else {
      const rawSlotName =
        typeof args.newLocation === 'object' && 'slotName' in args.newLocation
          ? args.newLocation.slotName
          : slotName
      location =
        runtimeParameters[rawSlotName] != null
          ? rawSlotName
          : formatPyStr(slotName)
      parentSlotForSlotCompatibility = slotName
    }
  } else if ('addressableAreaName' in newLocation) {
    const is4thColumnSlot = COLUMN_4_SLOTS.includes(
      newLocation.addressableAreaName
    )

    const isWasteChuteLocation = WASTE_CHUTE_ADDRESSABLE_AREAS.includes(
      newLocation.addressableAreaName
    )
    const isOt2TrashLocation = newLocation.addressableAreaName === 'fixedTrash'
    const isTrashBinLocation =
      MOVABLE_TRASH_ADDRESSABLE_AREAS.includes(
        newLocation.addressableAreaName
      ) || isOt2TrashLocation
    const trashCutoutIds = isTrashBinLocation
      ? Object.values(trashBinEntities)?.map(
          trash => trash.location as CutoutId
        )
      : []

    const cutoutIdFromAddressableAreaName =
      !isWasteChuteLocation &&
      !is4thColumnSlot &&
      !getIsSlotAVacuumDock(newLocation.addressableAreaName)
        ? getCutoutIdByAddressableArea(
            newLocation.addressableAreaName as AddressableAreaName,
            isOt2TrashLocation ? 'fixedTrashSlot' : 'trashBinAdapter',
            isOt2TrashLocation ? OT2_ROBOT_TYPE : FLEX_ROBOT_TYPE
          )
        : null

    const matchingTrashCutoutId = trashCutoutIds.find(
      cutoutId => cutoutId === cutoutIdFromAddressableAreaName
    )
    const matchingTrashId =
      matchingTrashCutoutId != null
        ? Object.values(trashBinEntities).find(
            ae => ae.location === matchingTrashCutoutId
          )?.id
        : null

    if (is4thColumnSlot) {
      const rawAreaName =
        typeof args.newLocation === 'object' &&
        'addressableAreaName' in args.newLocation
          ? args.newLocation.addressableAreaName
          : newLocation.addressableAreaName
      location =
        runtimeParameters[rawAreaName] != null
          ? rawAreaName
          : formatPyStr(newLocation.addressableAreaName)
    } else if (matchingTrashId != null && !isWasteChuteLocation) {
      location = trashBinEntities[matchingTrashId]?.pythonName ?? ''
    } else if (matchingTrashId == null && isWasteChuteLocation) {
      location = Object.values(wasteChuteEntities)[0]?.pythonName ?? ''
    } else if (getIsSlotAVacuumDock(newLocation.addressableAreaName)) {
      // Python location for the vacuum dock is a property of its module named `manifold_dock`
      const [foundVacuumModuleId] =
        Object.entries(prevRobotState.modules).find(
          ([, module]) => module.moduleState.type === VACUUM_MODULE_TYPE
        ) ?? []
      if (
        foundVacuumModuleId != null &&
        moduleEntities[foundVacuumModuleId] != null
      ) {
        const { pythonName } = moduleEntities[foundVacuumModuleId]
        location = `${pythonName}.manifold_dock`
      }
    } else {
      location = ''
    }
  }

  // check compatibility of stack to move to
  if (parentSlotForSlotCompatibility != null) {
    const largestStackInSlot = getLargestStackInSlot({
      slot: parentSlotForSlotCompatibility,
      labwareState: prevRobotState.labware,
      modulesState: prevRobotState.modules,
    })

    const slot = getSlotInLocationStack(largestStackInSlot)
    const { isCompatible, isAboveStackLimit } = getIsLabwareCompatibleWithStack(
      labwareId,
      largestStackInSlot,
      labwareEntities,
      moduleEntities
    )
    if (!isCompatible) {
      errors.push(errorCreators.multipleEntitiesOnSameSlotName())
    }
    if (isAboveStackLimit) {
      errors.push(errorCreators.stackTooHigh({ slot }))
    }
  }

  if (errors.length > 0) {
    return { errors }
  }

  if (location === '') {
    console.error('expected to find a python new location but could not')
  }

  const pythonUseGripper = useGripper ? ', use_gripper=True' : ''
  const isMovingLid = getIsLid(labwareEntities[labwareId].def)

  const labwareToMoveStack = prevRobotState.labware[labwareId].stack

  // transform target for move_lid source location
  // if moving a lid from a stack, we use the slot of the stack
  // if moving a lid from a labware, we use the labware's pythonName
  let lidToMoveLocation = ''
  if (isMovingLid) {
    const parentId = getNearestParentInStack(labwareToMoveStack)
    if (parentId == null) {
      console.error(
        'expected to find a parent for labware to move but could not'
      )
    } else {
      const isParentLabware = labwareEntities[parentId] != null
      const isParentLid =
        isParentLabware && getIsLid(labwareEntities[parentId].def)
      const isDirectlyOnSlot = labwareToMoveStack.length === 2 // lid and slot only
      const isParentLidStack =
        isDirectlyOnSlot || (isParentLabware && isParentLid)
      if (isParentLidStack) {
        lidToMoveLocation = formatPyStr(
          getSlotInLocationStack(labwareToMoveStack)
        )
      } else if (isParentLabware || !getIsLid(labwareEntities[parentId].def)) {
        // lid to move is on non-lid labware
        lidToMoveLocation = labwareEntities[parentId].pythonName
      }
    }
  }

  if (isMovingLid && lidToMoveLocation === '') {
    console.error('expected to find a valid lid move location but could not')
  }

  const python = isMovingLid
    ? `${PROTOCOL_CONTEXT_NAME}.move_lid(${lidToMoveLocation}, ${location}${pythonUseGripper})`
    : `${PROTOCOL_CONTEXT_NAME}.move_labware(${labwarePythonName}, ${location}${pythonUseGripper})`

  return {
    commands,
    ...(warnings.length > 0 ? { warnings } : {}),
    python,
  }
}
