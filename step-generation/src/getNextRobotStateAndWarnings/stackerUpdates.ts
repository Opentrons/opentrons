import {
  FLEX_STACKER_MODULE_V1,
  getHeightOfLabwareStackFromDefinitions,
  getLabwareOverlapOffset,
  getStackerMaxPoolCountByHeight,
  SYSTEM_LOCATION,
} from '@opentrons/shared-data'

import {
  BOTTOM_UP_LABWARE_POOL_KEYS,
  HOPPER_STACKER_LOCATION,
} from '../constants'
import { flexStackerStateGetter } from '../robotStateSelectors'
import { uuid } from '../utils'

import type {
  FlexStackerEmptyCreateCommand,
  FlexStackerFillItemsParams,
  FlexStackerFillParams,
  FlexStackerRetrieveCreateCommand,
  FlexStackerStoreCreateCommand,
  FlexStackerStoredLabwareGroup,
} from '@opentrons/shared-data'
import type { InvariantContext, RobotStateAndWarnings } from '../types'

export const forFlexStackerEmpty = (
  params: FlexStackerEmptyCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const labwareInHopper = Object.entries(robotState.labware).filter(
    ([, labware]) =>
      labware.stack.includes(HOPPER_STACKER_LOCATION) &&
      labware.stack.includes(moduleId)
  )
  const moduleState = flexStackerStateGetter(robotState, moduleId)
  if (moduleState != null && moduleState.labwareInHopper != null) {
    if (params.count != null) {
      moduleState.labwareInHopper = moduleState.labwareInHopper.slice(
        0,
        params.count
      )
    } else {
      moduleState.labwareInHopper = []
    }
  }
  labwareInHopper.forEach(([labwareId]) => {
    robotState.labware[labwareId] = {
      ...robotState.labware[labwareId],
      stack: [labwareId, SYSTEM_LOCATION],
    }
  })
}
export const forFlexStackerFillItems = (
  params: FlexStackerFillItemsParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { labwareEntities } = invariantContext
  const { moduleId, labware } = params

  const moduleSlot = robotState.modules[moduleId].slot
  const moduleState = flexStackerStateGetter(robotState, moduleId)

  if (moduleState == null || moduleState.storedLabwareDetails == null) {
    return
  }
  const { primaryLabwareURI, adapterLabwareURI, lidLabwareURI } =
    moduleState.storedLabwareDetails

  // group labware IDs by primaryyyy (each primary = one hopper position)
  const groups: Array<{
    primary: string
    adapter: string | null
    lid: string | null
  }> = []

  for (const labwareId of labware) {
    const defURI = labwareEntities[labwareId].labwareDefURI

    if (defURI === primaryLabwareURI) {
      groups.push({
        primary: labwareId,
        adapter: null,
        lid: null,
      })
    } else if (defURI === adapterLabwareURI) {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup) {
        lastGroup.adapter = labwareId
      }
    } else if (defURI === lidLabwareURI) {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup) {
        lastGroup.lid = labwareId
      }
    }
  }

  // rebuild ALL stacks (bottom-up)
  const baseStack = [HOPPER_STACKER_LOCATION, moduleId, moduleSlot]

  for (const group of groups) {
    const bottomUpStack = [
      group.adapter,
      group.primary,
      group.lid,
      ...baseStack,
    ].filter((v): v is string => v != null)

    // primary
    robotState.labware[group.primary] = {
      ...robotState.labware[group.primary],
      stack: bottomUpStack.slice(bottomUpStack.indexOf(group.primary)),
    }

    // adapter
    if (group.adapter != null) {
      robotState.labware[group.adapter] = {
        ...robotState.labware[group.adapter],
        stack: bottomUpStack.slice(bottomUpStack.indexOf(group.adapter)),
      }
    }

    // lid
    if (group.lid != null) {
      robotState.labware[group.lid] = {
        ...robotState.labware[group.lid],
        stack: bottomUpStack.slice(bottomUpStack.indexOf(group.lid)),
      }
    }
  }

  // Rebuild labwareInHopper
  const existingGroups = moduleState.labwareInHopper ?? []

  const newGroups: FlexStackerStoredLabwareGroup[] = groups.map(group => ({
    primaryLabwareId: group.primary,
    adapterLabwareId: group.adapter,
    lidLabwareId: group.lid,
  }))
  
  // index existing groups by primaryLabwareId
  const existingByPrimary = new Map(
    existingGroups.map(g => [g.primaryLabwareId, g])
  )
  
  // merge: new groups override existing ones with same primary
  const merged: FlexStackerStoredLabwareGroup[] = []
  
  for (const newGroup of newGroups) {
    merged.push(newGroup)
    existingByPrimary.delete(newGroup.primaryLabwareId)
  }
  
  // append remaining old groups (preserve their order)
  for (const oldGroup of existingGroups) {
    if (existingByPrimary.has(oldGroup.primaryLabwareId)) {
      merged.push(oldGroup)
    }
  }
  
  moduleState.labwareInHopper = merged
  moduleState.labwareFillQueue = null
}


export const forFlexStackerFill = (
  params: FlexStackerFillParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId, count } = params
  const moduleState = flexStackerStateGetter(robotState, moduleId)
  const labwareDefinition =
    invariantContext.labwareEntities[
      moduleState?.labwareInHopper?.[0].primaryLabwareId ?? ''
    ]?.def
  const listOfLabwareDefinitions = Array.from(
    { length: moduleState?.labwareInHopper?.length ?? 0 },
    _ => labwareDefinition
  )
  const poolHeight = getHeightOfLabwareStackFromDefinitions(
    listOfLabwareDefinitions
  )
  const poolOverlap = getLabwareOverlapOffset(
    FLEX_STACKER_MODULE_V1,
    labwareDefinition,
    'default'
  )
  const maxStorableLabware = getStackerMaxPoolCountByHeight(
    FLEX_STACKER_MODULE_V1,
    poolHeight,
    poolOverlap.z
  )

  if (moduleState != null) {
    if (
      count != null &&
      count > 0 &&
      maxStorableLabware > count + (moduleState.labwareInHopper?.length ?? 0)
    ) {
      // create labware entities for the new labware
      // TODO: wire up adapter and lid labware ids
      const newLabwareIdList = Array.from({ length: count }, () => ({
        primaryLabwareId: uuid(),
        adapterLabwareId: null,
        lidLabwareId: null,
      }))
      moduleState.labwareInHopper = [
        ...(moduleState.labwareInHopper ?? []),
        ...newLabwareIdList.map(id => ({
          primaryLabwareId: id,
          adapterLabwareId: null,
          lidLabwareId: null,
        })),
      ] as FlexStackerStoredLabwareGroup[]
    }
  }
}

export const forFlexStackerRetrieve = (
  params: FlexStackerRetrieveCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleState = flexStackerStateGetter(robotState, moduleId)
  const moduleSlot = robotState.modules[moduleId].slot
  if (moduleState != null) {
    const { labwareInHopper, labwareOnShuttle } = moduleState
    if (
      labwareInHopper != null &&
      labwareInHopper.length > 0 &&
      labwareOnShuttle == null
    ) {
      const labwareGroupOnShuttle = labwareInHopper[0]
      // set the shuttle group
      moduleState.labwareOnShuttle = labwareGroupOnShuttle
      // remove the shuttle group from the hopper
      labwareInHopper.shift()

      // build labware stacks on the deck
      const runningStack = [moduleSlot]
      for (const labwarePoolKey of BOTTOM_UP_LABWARE_POOL_KEYS) {
        const labwareId =
          labwareGroupOnShuttle[
            labwarePoolKey as keyof FlexStackerStoredLabwareGroup
          ]
        if (labwareId != null) {
          runningStack.unshift(labwareId)
          robotState.labware[labwareId].stack = runningStack
        }
      }
    }
  }
}

export const forFlexStackerStore = (
  params: FlexStackerStoreCreateCommand['params'],
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId } = params
  const moduleSlot = robotState.modules[moduleId].slot
  const moduleState = flexStackerStateGetter(robotState, moduleId)
  if (moduleState != null) {
    const { labwareOnShuttle } = moduleState
    if (labwareOnShuttle != null) {
      moduleState.labwareInHopper = [
        labwareOnShuttle,
        ...(moduleState.labwareInHopper ?? []),
      ]
      moduleState.labwareOnShuttle = null

      // build trivial stacks for stored labware group elements
      for (const labwarePoolKey of BOTTOM_UP_LABWARE_POOL_KEYS) {
        const labwareId =
          labwareOnShuttle[
            labwarePoolKey as keyof FlexStackerStoredLabwareGroup
          ]

        if (labwareId != null) {
          robotState.labware[labwareId].stack = [
            labwareId,
            HOPPER_STACKER_LOCATION,
            moduleId,
            moduleSlot,
          ]
        }
      }
    }
  }
}
