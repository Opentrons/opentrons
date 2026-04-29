import { SYSTEM_LOCATION } from '@opentrons/shared-data'

import {
  BOTTOM_UP_LABWARE_POOL_KEYS,
  HOPPER_STACKER_LOCATION,
} from '../constants'
import { flexStackerStateGetter } from '../robotStateSelectors'
import { getFlexStackerShuttleAddressableArea } from '../utils/misc'

import type {
  FlexStackerEmptyCreateCommand,
  FlexStackerFillItemsParams,
  FlexStackerFillParams,
  FlexStackerRetrieveCreateCommand,
  FlexStackerSetStoredLabwareItemsParams,
  FlexStackerSetStoredLabwareParams,
  FlexStackerStoreCreateCommand,
  FlexStackerStoredLabwareGroup,
} from '@opentrons/shared-data'
import type {
  FlexStackerModuleState,
  InvariantContext,
  LabwareEntities,
  LabwareEntity,
  RobotState,
  RobotStateAndWarnings,
} from '../types'

const getLabwareByDefURI = (
  availableLabwareIds: LabwareEntity[],
  defURI?: string | null
): string | null => {
  if (defURI == null) {
    console.error('expected to find defURI but could not in getLabwareByDefURI')
    return null
  }

  const index = availableLabwareIds.findIndex(lw => lw.labwareDefURI === defURI)

  if (index === -1) {
    return null
  }

  const [labware] = availableLabwareIds.splice(index, 1)
  return labware.id
}

// this function is used for setStoredLabware & fill analysis commands that started as
// setStoredLabwareItems and fillItems for PV
const setLabwareOnHopperFromItemCommands = (
  moduleState: FlexStackerModuleState,
  labwareToStore: FlexStackerStoredLabwareGroup[],
  robotState: RobotState,
  baseLabwareStack: string[]
): void => {
  const hopperGroup: FlexStackerStoredLabwareGroup[] =
    moduleState.labwareInHopper ?? []
  labwareToStore.forEach(storedLabware => {
    const { primaryLabwareId, adapterLabwareId, lidLabwareId } = storedLabware
    robotState.labware[primaryLabwareId] = {
      stack: [
        primaryLabwareId,
        ...(lidLabwareId != null ? [lidLabwareId] : []),
        ...baseLabwareStack,
      ],
    }
    if (adapterLabwareId != null) {
      robotState.labware[adapterLabwareId] = {
        stack: [
          adapterLabwareId,
          primaryLabwareId,
          ...(lidLabwareId != null ? [lidLabwareId] : []),
          ...baseLabwareStack,
        ],
      }
    }
    if (lidLabwareId != null) {
      robotState.labware[lidLabwareId] = {
        stack: [lidLabwareId, ...baseLabwareStack],
      }
    }
    hopperGroup.push({
      primaryLabwareId,
      adapterLabwareId: adapterLabwareId ?? null,
      lidLabwareId: lidLabwareId ?? null,
    })
  })
  moduleState.labwareInHopper = hopperGroup
}

// this fn is used for setting the hopper and labware locations for setStoredLabware and fill commands
const setLabwareOnHopper = (
  robotState: RobotState,
  moduleState: FlexStackerModuleState,
  labwareEntities: LabwareEntities,
  count: number,
  baseLabwareStack: string[],
  typeCount: 'setStoredLabwareCount' | 'fillCount',
  adapterLabware?: string | null,
  lidLabware?: string | null
): void => {
  // TODO(ja, 1/5/26): can you load liquids to the labware in the hopper in python using setStoredLabware?????
  // cuz with this current implementation, we have no way of knowing the group ordering. PD
  // doesn't use setStoredLawbare though, it uses setStoredLabwareItems, so we are good there

  // Get labware IDs associated with this setStoredLabwareCount or fillCount
  const labwareIdsForThisSet = Object.entries(robotState.labware)
    .filter(
      ([_, temporalProperties]) =>
        temporalProperties[typeCount] === moduleState[typeCount]
    )
    .map(([labwareId]) => labwareId)

  const availableLabwareIds = labwareIdsForThisSet.map(
    labwareId => labwareEntities[labwareId]
  )
  const groups: FlexStackerStoredLabwareGroup[] = []

  for (let i = 0; i < count; i++) {
    const primaryLabwareId = getLabwareByDefURI(
      availableLabwareIds,
      moduleState.storedLabwareDetails?.primaryLabwareURI
    )
    const adapterLabwareId =
      adapterLabware != null
        ? getLabwareByDefURI(
            availableLabwareIds,
            moduleState.storedLabwareDetails?.adapterLabwareURI
          )
        : null
    const lidLabwareId =
      lidLabware != null
        ? getLabwareByDefURI(
            availableLabwareIds,
            moduleState.storedLabwareDetails?.lidLabwareURI
          )
        : null

    if (primaryLabwareId != null) {
      robotState.labware[primaryLabwareId] = {
        stack: [
          primaryLabwareId,
          ...(lidLabwareId != null ? [lidLabwareId] : []),
          ...baseLabwareStack,
        ],
      }
      if (adapterLabwareId != null) {
        robotState.labware[adapterLabwareId] = {
          stack: [
            adapterLabwareId,
            primaryLabwareId,
            ...(lidLabwareId != null ? [lidLabwareId] : []),
            ...baseLabwareStack,
          ],
        }
      }
      if (lidLabwareId != null) {
        robotState.labware[lidLabwareId] = {
          stack: [lidLabwareId, ...baseLabwareStack],
        }
      }
      groups.push({
        primaryLabwareId,
        adapterLabwareId,
        lidLabwareId,
      })
    }
    moduleState.labwareInHopper = groups
  }
}

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
  const groups: FlexStackerStoredLabwareGroup[] = []

  for (const labwareId of labware) {
    const defURI = labwareEntities[labwareId].labwareDefURI

    if (defURI === primaryLabwareURI) {
      groups.push({
        primaryLabwareId: labwareId,
        adapterLabwareId: null,
        lidLabwareId: null,
      })
    } else if (defURI === adapterLabwareURI) {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup) {
        lastGroup.adapterLabwareId = labwareId
      }
    } else if (defURI === lidLabwareURI) {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup) {
        lastGroup.lidLabwareId = labwareId
      }
    }
  }

  // rebuild ALL stacks (bottom-up)
  const baseStack = [HOPPER_STACKER_LOCATION, moduleId, moduleSlot]

  for (const group of groups) {
    const bottomUpStack = [
      group.adapterLabwareId,
      group.primaryLabwareId,
      group.lidLabwareId,
      ...baseStack,
    ].filter((v): v is string => v != null)

    // primary
    robotState.labware[group.primaryLabwareId] = {
      ...robotState.labware[group.primaryLabwareId],
      stack: bottomUpStack.slice(bottomUpStack.indexOf(group.primaryLabwareId)),
    }

    // adapter
    if (group.adapterLabwareId != null) {
      robotState.labware[group.adapterLabwareId] = {
        ...robotState.labware[group.adapterLabwareId],
        stack: bottomUpStack.slice(
          bottomUpStack.indexOf(group.adapterLabwareId)
        ),
      }
    }

    // lid
    if (group.lidLabwareId != null) {
      robotState.labware[group.lidLabwareId] = {
        ...robotState.labware[group.lidLabwareId],
        stack: bottomUpStack.slice(bottomUpStack.indexOf(group.lidLabwareId)),
      }
    }
    let prevLabwareId: string | null = null
    for (const id of bottomUpStack) {
      // skip non-labware ids
      const isLabware = labwareEntities[id] != null
      if (!isLabware) {
        continue
      }
      if (prevLabwareId == null) {
        robotState.labware[id].stackedOnNode = {
          kind: 'inStackerHopper',
          moduleId,
        }
      } else {
        robotState.labware[id].stackedOnNode = {
          labwareId: prevLabwareId,
        }
      }
      prevLabwareId = id
    }
  }

  // Rebuild labwareInHopper
  const existingGroups = moduleState.labwareInHopper ?? []

  const newGroups: FlexStackerStoredLabwareGroup[] = groups.map(
    ({ primaryLabwareId, adapterLabwareId, lidLabwareId }) => ({
      primaryLabwareId,
      adapterLabwareId,
      lidLabwareId,
    })
  )

  moduleState.labwareInHopper = [...existingGroups, ...newGroups]
}

export const forFlexStackerSetStoredLabware = (
  params: FlexStackerSetStoredLabwareParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { labwareEntities } = invariantContext
  const {
    moduleId,
    primaryLabware,
    initialCount,
    adapterLabware,
    lidLabware,
    initialStoredLabware,
  } = params
  const moduleSlot = robotState.modules[moduleId].slot
  const moduleState = flexStackerStateGetter(robotState, moduleId)
  const baseLabwareStack = [HOPPER_STACKER_LOCATION, moduleId, moduleSlot]

  if (moduleState != null) {
    moduleState.storedLabwareDetails = {
      primaryLabwareURI: `${primaryLabware.namespace}/${primaryLabware.loadName}/${primaryLabware.version}`,
      adapterLabwareURI:
        adapterLabware != null
          ? `${adapterLabware.namespace}/${adapterLabware.loadName}/${adapterLabware.version}`
          : null,

      lidLabwareURI:
        lidLabware != null
          ? `${lidLabware.namespace}/${lidLabware.loadName}/${lidLabware.version}`
          : null,
    }

    if (initialCount != null) {
      setLabwareOnHopper(
        robotState,
        moduleState,
        labwareEntities,
        initialCount,
        baseLabwareStack,
        'setStoredLabwareCount',
        adapterLabware?.loadName,
        lidLabware?.loadName
      )
      // this param is from a setStoredLabwareItems which Pd emits but PE
      // transforms it into a setStoredLabware
    } else if (initialStoredLabware != null) {
      setLabwareOnHopperFromItemCommands(
        moduleState,
        initialStoredLabware,
        robotState,
        baseLabwareStack
      )
    }
    moduleState.setStoredLabwareCount =
      (moduleState?.setStoredLabwareCount ?? 0) + 1
  }
}

export const forFlexStackerSetStoredLabwareItems = (
  params: FlexStackerSetStoredLabwareItemsParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId, labware } = params
  const { labwareEntities } = invariantContext
  const moduleSlot = robotState.modules[moduleId].slot
  const moduleState = flexStackerStateGetter(robotState, moduleId)
  if (moduleState == null) {
    return
  }
  const labwareDefUris = labware.map(labwareIds => labwareIds.split(':')[1])
  const uniqueUris = new Set(labwareDefUris)
  const uniqueUriArray = Array.from(uniqueUris)
  const primaryLabwareURI = uniqueUriArray.find(uri =>
    Object.values(labwareEntities).find(
      entity =>
        entity.labwareDefURI === uri &&
        !entity.def.allowedRoles?.includes('lid') &&
        !entity.def.allowedRoles?.includes('adapter')
    )
  )
  const adapterLabwareURI = uniqueUriArray.find(uri =>
    Object.values(labwareEntities).find(
      entity =>
        entity.labwareDefURI === uri &&
        entity.def.allowedRoles?.includes('adapter')
    )
  )
  const lidLabwareURI = uniqueUriArray.find(uri =>
    Object.values(labwareEntities).find(
      entity =>
        entity.labwareDefURI === uri && entity.def.allowedRoles?.includes('lid')
    )
  )

  if (primaryLabwareURI == null) {
    throw new Error(
      `expected to find primaryLabwareURI for storedLabwareDetails but could not with labware ${labware}`
    )
  }

  moduleState.storedLabwareDetails = {
    primaryLabwareURI,
    adapterLabwareURI: adapterLabwareURI ?? null,
    lidLabwareURI: lidLabwareURI ?? null,
  }

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
}

export const forFlexStackerFill = (
  params: FlexStackerFillParams,
  invariantContext: InvariantContext,
  robotStateAndWarnings: RobotStateAndWarnings
): void => {
  const { robotState } = robotStateAndWarnings
  const { moduleId, count, labwareToStore } = params
  const { labwareEntities } = invariantContext
  const moduleSlot = robotState.modules[moduleId].slot
  const moduleState = flexStackerStateGetter(robotState, moduleId)
  const baseLabwareStack = [HOPPER_STACKER_LOCATION, moduleId, moduleSlot]
  if (moduleState != null) {
    const adapterLabware = moduleState.storedLabwareDetails?.adapterLabwareURI
    const lidLabware = moduleState.storedLabwareDetails?.lidLabwareURI

    if (count != null) {
      setLabwareOnHopper(
        robotState,
        moduleState,
        labwareEntities,
        count,
        baseLabwareStack,
        'fillCount',
        adapterLabware,
        lidLabware
      )
    } else if (labwareToStore != null) {
      setLabwareOnHopperFromItemCommands(
        moduleState,
        labwareToStore,
        robotState,
        baseLabwareStack
      )
    }

    // assign new fill command count
    moduleState.fillCount = (moduleState?.fillCount ?? 0) + 1
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

      // build labware stacks on the deck (bottom-up pool order: adapter → primary → lid)
      const runningStack = [moduleSlot]
      let prevLabwareInShuttleStack: string | null = null
      for (const labwarePoolKey of BOTTOM_UP_LABWARE_POOL_KEYS) {
        const pieceId =
          labwareGroupOnShuttle[
            labwarePoolKey as keyof FlexStackerStoredLabwareGroup
          ]
        if (pieceId != null) {
          runningStack.unshift(pieceId)
          robotState.labware[pieceId].stack = [...runningStack]
          if (prevLabwareInShuttleStack == null) {
            const shuttleAA = getFlexStackerShuttleAddressableArea(moduleSlot)
            if (shuttleAA != null) {
              robotState.labware[pieceId].stackedOnNode = {
                addressableAreaName: shuttleAA,
              }
            } else {
              console.warn(
                `Could not find an addressable area for retrieved labware in stacker module ${moduleId} at slot ${moduleSlot}`
              )
            }
          } else {
            robotState.labware[pieceId].stackedOnNode = {
              labwareId: prevLabwareInShuttleStack,
            }
          }
          prevLabwareInShuttleStack = pieceId
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
  const moduleState = flexStackerStateGetter(robotState, moduleId)
  const moduleSlot = robotState.modules[moduleId].slot
  if (moduleState != null) {
    const { labwareOnShuttle } = moduleState
    if (labwareOnShuttle != null) {
      moduleState.labwareInHopper = [
        labwareOnShuttle,
        ...(moduleState.labwareInHopper ?? []),
      ]
      moduleState.labwareOnShuttle = null

      // build trivial stacks for stored labware group elements
      let prevLabwareId: string | null = null
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
          if (prevLabwareId == null) {
            robotState.labware[labwareId].stackedOnNode = {
              kind: 'inStackerHopper',
              moduleId,
            }
            prevLabwareId = labwareId
          } else {
            robotState.labware[labwareId].stackedOnNode = {
              labwareId: prevLabwareId,
            }
          }
        }
      }
      // if there are no stored labware details, set them now
      if (moduleState.storedLabwareDetails == null) {
        moduleState.storedLabwareDetails = {
          primaryLabwareURI:
            invariantContext.labwareEntities[labwareOnShuttle.primaryLabwareId]
              .labwareDefURI,
          adapterLabwareURI:
            labwareOnShuttle.adapterLabwareId != null
              ? invariantContext.labwareEntities[
                  labwareOnShuttle.adapterLabwareId
                ].labwareDefURI
              : null,
          lidLabwareURI:
            labwareOnShuttle.lidLabwareId != null
              ? invariantContext.labwareEntities[labwareOnShuttle.lidLabwareId]
                  .labwareDefURI
              : null,
        }
      }
    }
  }
}
