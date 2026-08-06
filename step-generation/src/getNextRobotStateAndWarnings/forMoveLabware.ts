import mapValues from 'lodash/mapValues'
import omit from 'lodash/omit'

import {
  FLEX_STACKER_MODULE_TYPE,
  getIsLid,
  getIsPipettableLabware,
  locationIsOffDeck,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import { BOTTOM_UP_LABWARE_POOL_KEYS, VACUUM_DOCK_LOCATION } from '../constants'
import { TOUCHED_PIPETTABLE_LABWARE } from '../types'
import {
  getFlexStackerShuttleAddressableArea,
  getFullStackFromLabwares,
  getIsSlotAVacuumDock,
  getLargestStackInSlot,
  getSlotInLocationStack,
} from '../utils'
import { assignContainsAmongSiblings } from '../utils/traversals'

import type {
  FlexStackerStoredLabwareGroup,
  MoveLabwareParams,
} from '@opentrons/shared-data'
import type {
  FlexStackerModuleState,
  InvariantContext,
  RobotStateAndWarnings,
} from '../types'

export function forMoveLabware(
  params: MoveLabwareParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void {
  const { labwareId, newLocation } = params
  const { robotState } = robotStateAndWarnings
  const { labwareEntities } = invariantContext
  const { modules, labware } = robotState
  if (labware[labwareId] == null) {
    return
  }
  const initialDeckSlot = getSlotInLocationStack(labware[labwareId].stack)
  const fullStackFromLabwares = getFullStackFromLabwares(
    labware,
    initialDeckSlot,
    labwareId
  )
  const index = fullStackFromLabwares.indexOf(labwareId)
  const labwareToMove = fullStackFromLabwares.slice(0, index + 1) // includes labwareId you're moving

  const isLabwareToMoveLid = getIsLid(labwareEntities[labwareId].def)
  let isParentPipettableLabware: boolean = false

  // update shuttle if it is the initial location of the move
  const initialShuttleParentStackerState =
    Object.entries(modules).find(([id, { slot }]) => {
      const { type } = invariantContext.moduleEntities[id] ?? {}
      return type === FLEX_STACKER_MODULE_TYPE && slot === initialDeckSlot
    }) ?? null

  const movedStackFromShuttle =
    initialShuttleParentStackerState != null &&
    initialShuttleParentStackerState[1].moduleState.type ===
      FLEX_STACKER_MODULE_TYPE
      ? BOTTOM_UP_LABWARE_POOL_KEYS.map(
          key =>
            (
              initialShuttleParentStackerState[1]
                .moduleState as FlexStackerModuleState
            ).labwareOnShuttle?.[key]
        ).filter((id): id is string => id != null)
      : []

  const movedStackUpToTarget = movedStackFromShuttle.includes(labwareId)
    ? movedStackFromShuttle.slice(
        0,
        movedStackFromShuttle.indexOf(labwareId) + 1
      )
    : []

  if (
    initialShuttleParentStackerState != null &&
    initialShuttleParentStackerState[1].moduleState.type ===
      FLEX_STACKER_MODULE_TYPE
  ) {
    const moduleState = initialShuttleParentStackerState[1]
      .moduleState as FlexStackerModuleState
    const firstAffectedKey = BOTTOM_UP_LABWARE_POOL_KEYS.findIndex(
      key => moduleState.labwareOnShuttle?.[key] === labwareId
    )
    if (firstAffectedKey !== -1 && moduleState.labwareOnShuttle != null) {
      // remove everything above the target labware in the shuttle stack
      for (const key of BOTTOM_UP_LABWARE_POOL_KEYS.slice(
        firstAffectedKey,
        BOTTOM_UP_LABWARE_POOL_KEYS.length
      )) {
        if (key === 'primaryLabwareId') {
          moduleState.labwareOnShuttle = null
          break
        } else {
          moduleState.labwareOnShuttle[key] = null
        }
      }
    }
  }

  // update shuttle if it is the new location of the move
  const newShuttleParentStackerState =
    Object.entries(modules).find(([id, { slot }]) => {
      const { type } = invariantContext.moduleEntities[id] ?? {}
      return (
        type === FLEX_STACKER_MODULE_TYPE &&
        typeof newLocation === 'object' &&
        (('moduleId' in newLocation && newLocation.moduleId === id) ||
          ('slotName' in newLocation && slot === newLocation.slotName))
      )
    }) ?? null
  const [newModuleId, newStackerOnDeck] = newShuttleParentStackerState ?? []
  if (newModuleId != null && newStackerOnDeck != null) {
    const fullStack =
      movedStackUpToTarget.length > 0
        ? movedStackUpToTarget
        : getLargestStackInSlot({
            slot: initialDeckSlot,
            labwareState: labware,
            modulesState: modules,
          })
    const stackIndexOfTarget = fullStack.indexOf(labwareId)
    const moduleState = newStackerOnDeck.moduleState as FlexStackerModuleState
    if (stackIndexOfTarget !== -1) {
      const stackFromTargetUp = fullStack
        .slice(0, stackIndexOfTarget + 1) // inclusive of target
        .toReversed()
      if (moduleState.labwareOnShuttle == null) {
        // initialize the shuttle group
        moduleState.labwareOnShuttle = {
          primaryLabwareId: '',
          adapterLabwareId: null,
          lidLabwareId: null,
        }
      }
      if (stackFromTargetUp.length === 3) {
        // updating each element of the shuttle group (adapter + primary + lid)
        for (let i = 0; i < BOTTOM_UP_LABWARE_POOL_KEYS.length; i++) {
          const key = BOTTOM_UP_LABWARE_POOL_KEYS[i]
          moduleState.labwareOnShuttle![key] = stackFromTargetUp[i]
        }
      } else if (stackFromTargetUp.length === 2) {
        // either adapter + primary or primary + lid
        const keysToUpdate = stackFromTargetUp.some(id =>
          invariantContext.labwareEntities[id].def.allowedRoles?.some(
            role => role === 'lid'
          )
        )
          ? ['primaryLabwareId', 'lidLabwareId']
          : ['adapterLabwareId', 'primaryLabwareId']
        for (let i = 0; i < keysToUpdate.length; i++) {
          const key = keysToUpdate[i]
          moduleState.labwareOnShuttle![
            key as keyof FlexStackerStoredLabwareGroup
          ] = stackFromTargetUp[i]
        }
      } else if (stackFromTargetUp.length === 1) {
        // primary labware only
        moduleState.labwareOnShuttle!.primaryLabwareId = stackFromTargetUp[0]
      }
    }
  }
  const newLocationStack: string[] = []
  if (locationIsOffDeck(newLocation)) {
    newLocationStack.push(newLocation)
  } else if ('moduleId' in newLocation) {
    //  NOTE: this special-case is only for PV. PD should not
    //  be affected. PV's newLocation comes from the command.params
    //  which includes moduleId when moving a labware onto the stacker shuttle
    //  but for PD, the newLocation does not include the moduleId
    if (
      modules[newLocation.moduleId].moduleState.type ===
      FLEX_STACKER_MODULE_TYPE
    ) {
      newLocationStack.push(modules[newLocation.moduleId].slot)
    } else if (
      invariantContext.moduleEntities[newLocation.moduleId]?.type ===
      VACUUM_MODULE_TYPE
    ) {
      // For vacuum module: stack onto whatever is currently on the module's main slot
      // so that [collar, ...existingModuleLabware, moduleId, slot] is built correctly
      const moduleSlot = modules[newLocation.moduleId].slot
      const existingStack = getLargestStackInSlot({
        slot: moduleSlot,
        labwareState: labware,
        modulesState: modules,
      })
      if (existingStack.length > 0) {
        newLocationStack.push(...existingStack)
      } else {
        newLocationStack.push(newLocation.moduleId, moduleSlot)
      }
    } else {
      newLocationStack.push(
        newLocation.moduleId,
        modules[newLocation.moduleId].slot
      )
    }
  } else if ('slotName' in newLocation) {
    // need to handle slotName being a labwareId or a slotId (misleading property name)
    const { slotName } = newLocation
    // new location is a labware stack
    if (slotName in labware) {
      isParentPipettableLabware = getIsPipettableLabware(
        labwareEntities[slotName].def
      )
      newLocationStack.push(...labware[slotName].stack)
    } else {
      // new location is a slot
      newLocationStack.push(slotName)
    }
  } else if ('labwareId' in newLocation) {
    const labwareId = newLocation.labwareId
    isParentPipettableLabware = getIsPipettableLabware(
      labwareEntities[labwareId].def
    )
    const labwareIdStack = labware[labwareId].stack
    newLocationStack.push(...labwareIdStack)
  } else if ('addressableAreaName' in newLocation) {
    if (getIsSlotAVacuumDock(newLocation.addressableAreaName)) {
      const vacuumModuleId = Object.entries(modules).find(
        ([moduleId]) =>
          invariantContext.moduleEntities[moduleId]?.type === VACUUM_MODULE_TYPE
      )?.[0]
      newLocationStack.push(VACUUM_DOCK_LOCATION)
      if (vacuumModuleId != null) {
        newLocationStack.push(vacuumModuleId)
      }
      newLocationStack.push(newLocation.addressableAreaName)
    } else {
      newLocationStack.push(newLocation.addressableAreaName)
    }
  }
  labwareToMove.forEach((id, i) => {
    if (labware[id] != null) {
      const stackBelow = labwareToMove.slice(i + 1) // what's under labware you're moving
      robotState.labware[id] = {
        ...robotState.labware[id],
        stack: [id, ...stackBelow, ...newLocationStack],
        ...(isLabwareToMoveLid && isParentPipettableLabware
          ? { sterility: TOUCHED_PIPETTABLE_LABWARE }
          : {}),
      }
    }
  })

  // duplicative, but we will remove the above stack logic, so keep it here for now
  const isNewParentPipettableLabware =
    typeof newLocation === 'object' &&
    'labwareId' in newLocation &&
    getIsPipettableLabware(labwareEntities[newLocation.labwareId].def)
  let stackedOnNodeForMovedPrimary = newLocation
  if (
    typeof newLocation === 'object' &&
    newLocation !== null &&
    'moduleId' in newLocation &&
    modules[newLocation.moduleId].moduleState.type === FLEX_STACKER_MODULE_TYPE
  ) {
    const shuttleAa = getFlexStackerShuttleAddressableArea(
      modules[newLocation.moduleId].slot
    )
    if (shuttleAa != null) {
      stackedOnNodeForMovedPrimary = { addressableAreaName: shuttleAa }
    }
  } else if (
    typeof newLocation === 'object' &&
    newLocation !== null &&
    'moduleId' in newLocation &&
    invariantContext.moduleEntities[newLocation.moduleId]?.type ===
      VACUUM_MODULE_TYPE
  ) {
    // The collar stacks onto the topmost existing labware on the module, not the module itself
    const moduleSlot = modules[newLocation.moduleId].slot
    const existingStack = getLargestStackInSlot({
      slot: moduleSlot,
      labwareState: labware,
      modulesState: modules,
    })
    const topLabwareIdOnModule =
      existingStack.length > 0 ? existingStack[0] : null
    if (
      topLabwareIdOnModule != null &&
      topLabwareIdOnModule in labwareEntities
    ) {
      stackedOnNodeForMovedPrimary = { labwareId: topLabwareIdOnModule }
    }
  }
  robotState.labware[labwareId].stackedOnNode = stackedOnNodeForMovedPrimary
  if (isNewParentPipettableLabware) {
    robotState.labware[labwareId].sterility = TOUCHED_PIPETTABLE_LABWARE
  }
  // Sibling `contains` depends on shared `stackedOnNode`; clear existing 'contains' and re-derive after the move.
  robotState.labware = assignContainsAmongSiblings(
    mapValues(robotState.labware, lw => omit(lw, 'contains')),
    labwareEntities
  )
}
