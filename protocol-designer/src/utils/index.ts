import snakeCase from 'lodash/snakeCase'
import { v4 as uuidv4 } from 'uuid'

import {
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getDeckDefFromRobotType,
  getLabwareDefURI,
  getTiprackVolume,
  INTERACTIVE_WELL_DATA_ATTRIBUTE,
  isAddressableAreaStandardSlot,
  makeWellSetHelpers,
  STAGING_AREA_RIGHT_SLOT_FIXTURE,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  FAKE_HOPPER_LOCATION_MAP,
  getSlotInLocationStack,
  HOPPER_STACKER_LOCATION,
  PROTOCOL_CONTEXT_NAME,
  VACUUM_DOCK_LOCATION,
} from '@opentrons/step-generation'

import type { WellGroup } from '@opentrons/components'
import type {
  AddressableAreaName,
  CutoutId,
  DeckSlotId,
  LabwareDefinition2,
  LabwareDisplayCategory,
  ModuleType,
  PipetteV2Specs,
  SupportedTip,
  WellSetHelpers,
} from '@opentrons/shared-data'
import type {
  AdditionalEquipmentEntity,
  HopperLocationMapKey,
  LabwareEntities,
  ModuleEntity,
  PipetteEntities,
} from '@opentrons/step-generation'
import type { BoundingRect, GenericRect } from '../collision-types'
import type {
  AllTemporalPropertiesForTimelineFrame,
  InitialDeckSetup,
  LabwareOnDeck,
  ModuleEntities,
} from '../step-forms'

export const uuid: () => string = uuidv4
// Collision detection for SelectionRect / SelectableLabware
export const rectCollision = (
  rect1: BoundingRect,
  rect2: BoundingRect
): boolean =>
  rect1.x < rect2.x + rect2.width &&
  rect1.x + rect1.width > rect2.x &&
  rect1.y < rect2.y + rect2.height &&
  rect1.height + rect1.y > rect2.y
export function clientRectToBoundingRect(rect: ClientRect): BoundingRect {
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  }
}
export const getCollidingWells = (rectPositions: GenericRect): WellGroup => {
  // Returns set of selected wells under a collision rect
  const { x0, y0, x1, y1 } = rectPositions
  const selectionBoundingRect = {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  }
  // NOTE: querySelectorAll returns a NodeList, so you need to unpack it as an Array to do .filter
  const selectableElems: HTMLElement[] = [
    ...document.querySelectorAll<HTMLElement>(
      `[${INTERACTIVE_WELL_DATA_ATTRIBUTE}]`
    ),
  ]
  const collidedElems = selectableElems.filter((selectableElem, i) =>
    rectCollision(
      selectionBoundingRect,
      clientRectToBoundingRect(selectableElem.getBoundingClientRect())
    )
  )
  const collidedWellData = collidedElems.reduce(
    (acc: WellGroup, elem): WellGroup => {
      if (
        INTERACTIVE_WELL_DATA_ATTRIBUTE.replace('data-', '') in elem.dataset
      ) {
        const wellName = elem.dataset.wellname
        return wellName != null ? { ...acc, [wellName]: null } : acc
      }

      return acc
    },
    {}
  )
  return collidedWellData
}
export const arrayToWellGroup = (w: string[]): WellGroup =>
  w.reduce((acc, wellName) => ({ ...acc, [wellName]: null }), {})
// cross-PD memoization of well set utils
const wellSetHelpers: WellSetHelpers = makeWellSetHelpers()
const {
  canPipetteUseLabware,
  getAllWellSetsForLabware,
  getWellSetForMultichannel,
} = wellSetHelpers
export {
  canPipetteUseLabware,
  getAllWellSetsForLabware,
  getWellSetForMultichannel,
}
export const makeTemperatureText = (
  temperature: number | string | null,
  t: any
): string =>
  temperature === null
    ? t('modules:status.deactivated')
    : `${temperature} ${t('application:units.degrees')}`
export const makeLidLabelText = (lidOpen: boolean, t: any): string =>
  t(`modules:lid_label`, {
    lidStatus: t(lidOpen ? 'modules:lid_open' : 'modules:lid_closed'),
  })

export const makeSpeedText = (
  targetSpeed: number | string | null,
  t: any
): string =>
  targetSpeed === null
    ? t('modules:status.deactivated')
    : `${targetSpeed} ${t('application:units.rpm')}`

export const makeTimerText = (
  targetMinutes: number | string | null,
  targetSeconds: number | string | null,
  t: any
): string | null =>
  targetMinutes === null && targetSeconds === null
    ? null
    : `${targetMinutes}  ${t(
        'application:units.minutes'
      )} ${targetSeconds}  ${t('application:units.seconds')} timer`

export const getIsAdapter = (
  labwareId: string,
  labwareEntities: LabwareEntities
): boolean => {
  if (labwareEntities[labwareId] == null) return false
  return getIsAdapterFromDef(labwareEntities[labwareId].def)
}

export const getIsAdapterFromDef = (labwareDef: LabwareDefinition2): boolean =>
  labwareDef.allowedRoles?.includes('adapter') ?? false

export const getStagingAreaSlots = (
  stagingAreas?: AdditionalEquipmentEntity[]
): string[] | null => {
  if (stagingAreas == null) return null
  //  we can assume that the location is always a string
  return stagingAreas.map(area => area.location as string)
}

export const getHas96Channel = (pipettes: PipetteEntities): boolean => {
  return Object.values(pipettes).some(pip => pip.spec.channels === 96)
}

export const getStagingAreaAddressableAreas = (
  cutoutIds: CutoutId[],
  filterStandardSlots: boolean = true
): AddressableAreaName[] => {
  const deckDef = getDeckDefFromRobotType(FLEX_ROBOT_TYPE)
  const cutoutFixtures = deckDef.cutoutFixtures

  const addressableAreasRaw = cutoutIds.flatMap(cutoutId => {
    const addressableAreasOnCutout = cutoutFixtures.find(
      cutoutFixture => cutoutFixture.id === STAGING_AREA_RIGHT_SLOT_FIXTURE
    )?.providesAddressableAreas[cutoutId]
    return addressableAreasOnCutout ?? []
  })
  if (filterStandardSlots) {
    return addressableAreasRaw.filter(
      aa => !isAddressableAreaStandardSlot(aa, deckDef)
    )
  }
  return addressableAreasRaw
}

export function getMatchingTipLiquidSpecs(
  pipetteSpecs: PipetteV2Specs,
  volume: number,
  tiprackDef: LabwareDefinition2
): SupportedTip {
  const tipLength = tiprackDef?.parameters?.tipLength ?? 0

  console.assert(
    tipLength > 0,
    `expected to find a tiplength for tiprack ${tiprackDef && getLabwareDefURI(tiprackDef)} but could not`
  )

  const isLowVolumePipette = Object.keys(pipetteSpecs.liquids).some(
    key => key === 'lowVolumeDefault'
  )
  const isUsingLowVolume = volume < 5
  const liquidType =
    isLowVolumePipette && isUsingLowVolume ? 'lowVolumeDefault' : 'default'
  const liquidSupportedTips = Object.values(
    pipetteSpecs.liquids[liquidType].supportedTips
  )

  //  find the supported tip liquid specs that either exactly match
  //  tipLength or are closest, this accounts for custom tipracks
  const matchingTipLiquidSpecs = liquidSupportedTips.sort((tipA, tipB) => {
    const differenceA = Math.abs(tipA.defaultTipLength - tipLength)
    const differenceB = Math.abs(tipB.defaultTipLength - tipLength)
    return differenceA - differenceB
  })[0]
  console.assert(
    matchingTipLiquidSpecs != null,
    `expected to find the tip liquid specs but could not for tiprack ${getLabwareDefURI(tiprackDef)}`
  )

  return matchingTipLiquidSpecs
}

/**
 * Removes specific phrases from the input string.
 *
 * This function removes the following phrases from the input string:
 * - 'Opentrons Flex 96'
 * - 'Opentrons OT-2 96'
 * - '(Retired)'
 * - '96' (only if it is not the first two characters)
 *
 * @param {string} input - The input string from which phrases will be removed.
 * @returns {string} - The modified string with specified phrases removed.
 */
export const removeOpentronsPhrases = (input: string): string => {
  const phrasesToRemove = [
    'Opentrons Flex 96',
    'Opentrons OT-2 96',
    '\\(Retired\\)',
    '96',
    'Eppendorf',
  ]

  const updatedText = phrasesToRemove
    .reduce((text, phrase) => {
      return text.replace(new RegExp(phrase, 'gi'), '')
    }, input)
    .trim()
    .replace(/\s+/g, ' ')

  return updatedText.trim()
}

const getModuleShortnameForPython = (type: ModuleType): string => {
  const shortName = type.split('Type')[0]
  return snakeCase(shortName)
}

export const getModulePythonName = (
  type: ModuleType,
  typeCount: number
): string => {
  return `${getModuleShortnameForPython(type)}_${typeCount}`
}

export const getLabwarePythonName = (
  labwareDisplayCategory: LabwareDisplayCategory,
  typeCount: number
): string => {
  return `${snakeCase(labwareDisplayCategory)}_${typeCount}`
}

export const getAdditionalEquipmentPythonName = (
  fixtureName: 'wasteChute' | 'trashBin',
  typeCount: number,
  location?: string
): string => {
  switch (fixtureName) {
    case 'wasteChute': {
      return snakeCase(fixtureName)
    }
    case 'trashBin': {
      if (location === 'cutout12') {
        return `${PROTOCOL_CONTEXT_NAME}.fixed_trash`
      } else {
        return `${snakeCase(fixtureName)}_${typeCount}`
      }
    }
  }
}

export const getDefaultBlowoutFlowRate = (
  transferVolume: number,
  pipetteSpecs: PipetteV2Specs,
  tiprackDef: LabwareDefinition2
): number | null => {
  const { liquids } = pipetteSpecs
  const isInLowVolumeMode =
    transferVolume < liquids.default.minVolume && 'lowVolumeDefault' in liquids
  const liquidsObject = isInLowVolumeMode
    ? liquids.lowVolumeDefault
    : liquids.default
  // if the tiprack is not in the pipette's supportedTips, we'll just return null:
  return liquidsObject.supportedTips[
    `t${tiprackDef.wells.A1.totalLiquidVolume}`
  ]?.defaultBlowOutFlowRate.default
}

export const getDefaultPushOutVolume = (
  transferVolume: number,
  pipetteSpecs: PipetteV2Specs,
  tiprackDefinition: LabwareDefinition2
): number => {
  const { liquids } = pipetteSpecs
  if (tiprackDefinition == null) {
    return 0
  }
  console.assert(
    tiprackDefinition.metadata.displayCategory === 'tipRack',
    'Specified labware entity must be tiprack'
  )
  const tipVolume = Object.values(tiprackDefinition.wells)[0].totalLiquidVolume
  const lookupKey =
    transferVolume < liquids.default.minVolume && 'lowVolumeDefault' in liquids
      ? 'lowVolumeDefault'
      : 'default'
  const tipVolumeKey = `t${tipVolume}`
  return (
    liquids[lookupKey].supportedTips[tipVolumeKey]?.defaultPushOutVolume ?? 0
  )
}

export const getMaxConditioningVolume = (args: {
  transferVolume: number
  disposalVolume: number
  tiprackDef: LabwareDefinition2
  pipetteSpecs: PipetteV2Specs
}): number => {
  const { transferVolume, disposalVolume, tiprackDef, pipetteSpecs } = args
  const { liquids } = pipetteSpecs
  const minVolumeForMultiDispense = transferVolume * 2
  const isInLowVolumeMode =
    minVolumeForMultiDispense < liquids.default.minVolume &&
    'lowVolumeDefault' in liquids
  const tipMaxVolume = tiprackDef != null ? getTiprackVolume(tiprackDef) : null

  const maxWorkingVolume = Math.min(
    isInLowVolumeMode
      ? liquids.lowVolumeDefault.maxVolume
      : liquids.default.maxVolume,
    ...(tipMaxVolume != null ? [tipMaxVolume] : [])
  )
  return Math.max(
    0,
    maxWorkingVolume - disposalVolume - minVolumeForMultiDispense
  )
}

//  for stacking
export function getLocationStackTopToBottom(
  labwareId: string,
  labwareLocationUpdate: Record<string, string>,
  moduleLocationUpdate: Record<string, string>,
  moduleEntities: ModuleEntities
): string[] {
  const stack: string[] = []
  const visited = new Set<string>()
  let current: string | undefined = labwareId

  while (current != null) {
    // Cycle detection: if we've seen this node before, break to prevent infinite loop
    if (visited.has(current)) {
      break
    }
    visited.add(current)
    stack.push(current)
    const slot: string | undefined = labwareLocationUpdate[current]
    const parent: string | undefined = slot ?? moduleLocationUpdate[current]
    const isOnHopper =
      moduleEntities[slot] != null &&
      moduleEntities[slot].type === FLEX_STACKER_MODULE_TYPE
    if (isOnHopper) {
      // Hopper stack shape: [labware, hopper, moduleId, slot]
      // So when the node is on the hopper, insert the hopper marker once
      stack.push(HOPPER_STACKER_LOCATION)
    }
    const isOnVacuumDock = slot === 'vacuumModuleV1DockA4'
    if (isOnVacuumDock) {
      // Vacuum dock stack shape: [labware1, labware2, vacuumDock, moduleId, slot]
      // So when the node is on the vacuum dock, insert the vacuumDock marker once
      stack.push(VACUUM_DOCK_LOCATION)
      // Find the vacuum module in A3 (dock is always associated with module in A3)
      // Check both by slot 'A3' and by looking through all modules for safety
      let vacuumModuleInA3: ModuleEntity | null = moduleEntities.A3
      if (vacuumModuleInA3 == null) {
        // moduleEntities might be keyed by ID instead of slot, search through all
        vacuumModuleInA3 =
          Object.values(moduleEntities).find(
            module => module.type === VACUUM_MODULE_TYPE
          ) ?? null
      }
      if (vacuumModuleInA3 != null) {
        stack.push(vacuumModuleInA3.id)
      }
    }
    current = parent
  }
  return stack
}

export const getLabwaresOnModuleFromStack = (
  moduleId: string,
  labware: LabwareOnDeck[]
): {
  topMostId: string | null
  rightBelowTopId: string | null
  hopperTopMostId: string | null
  vacuumDockTopMostId: string | null
} => {
  // all stacks involving this module and not on the hopper or vacuum dock
  const allStacks = labware.filter(
    ({ stack }) =>
      stack.includes(moduleId) &&
      !stack.includes(HOPPER_STACKER_LOCATION) &&
      !stack.includes(VACUUM_DOCK_LOCATION)
  )
  const largestStack = allStacks.sort(
    (a, b) => b.stack.length - a.stack.length
  )[0]
  const topMostId = largestStack?.stack[0]
  const isTopMostIdALid = labware.find(
    lw => lw.id === topMostId && lw.def.allowedRoles?.includes('lid')
  )
  // all stacks involving the hopper if there is one
  const allStacksOnHopper = labware.filter(
    ({ stack }) =>
      stack.includes(moduleId) && stack.includes(HOPPER_STACKER_LOCATION)
  )
  const largestStackOnHopper = allStacksOnHopper.sort(
    (a, b) => b.stack.length - a.stack.length
  )[0]
  // all stacks involving the vacuum dock if there is one
  const allStacksOnVacuumDock = labware.filter(
    ({ stack }) =>
      stack.includes(moduleId) && stack.includes(VACUUM_DOCK_LOCATION)
  )
  const largestStackOnVacuumDock = allStacksOnVacuumDock.sort(
    (a, b) => b.stack.length - a.stack.length
  )[0]
  return {
    topMostId: largestStack?.stack[0],
    rightBelowTopId: isTopMostIdALid ? largestStack?.stack[1] : null,
    hopperTopMostId: largestStackOnHopper?.stack[0],
    vacuumDockTopMostId: largestStackOnVacuumDock?.stack[0],
  }
}

export const getFullStackFromLabwaresOnDeck = (
  labwareOnDeck: LabwareOnDeck[],
  slot: DeckSlotId,
  onHopper: boolean,
  onVacuumDock: boolean = false
): string[] => {
  let slotInStack: AddressableAreaName | string
  if (onHopper) {
    slotInStack = FAKE_HOPPER_LOCATION_MAP[slot as HopperLocationMapKey]
  } else if (onVacuumDock) {
    slotInStack = slot
  } else {
    slotInStack = slot
  }
  return (
    labwareOnDeck
      .filter(
        ({ stack }) =>
          stack.includes(slotInStack as string) &&
          onHopper === stack.includes(HOPPER_STACKER_LOCATION) &&
          onVacuumDock === stack.includes(VACUUM_DOCK_LOCATION)
      )
      .sort((a, b) => b.stack.length - a.stack.length)[0]?.stack ?? []
  )
}

export const getModuleIdFromStack = (
  stack: string[],
  modulesById: InitialDeckSetup['modules'] | ModuleEntities
): string | null => {
  return stack.find(id => modulesById[id] != null) ?? null
}

export const getLabwareIdAfterModuleIdInStack = (
  moduleId: string,
  labware: {
    [labwareId: string]: LabwareOnDeck
  }
): string | null => {
  const matchingLabware = Object.values(labware).find(lw =>
    lw.stack.includes(moduleId)
  )
  if (!matchingLabware) {
    return null
  }

  const index = matchingLabware.stack.indexOf(moduleId)
  const indexAfter = index + 1

  return matchingLabware.stack[indexAfter] ?? null
}

export const getHasTrash = (
  additionalEquipment: AllTemporalPropertiesForTimelineFrame['additionalEquipmentOnDeck']
): boolean => {
  return Object.values(additionalEquipment).some(
    ae => ae.name === 'trashBin' || ae.name === 'wasteChute'
  )
}

export const getAllLabwareIdsOfCertainURIOnStack = (
  deckSetupLabware: AllTemporalPropertiesForTimelineFrame['labware'],
  labwareOnDeck: LabwareOnDeck
): string[] => {
  return Object.values(deckSetupLabware).reduce<string[]>(
    (acc, { labwareDefURI, stack, id }) => {
      return labwareDefURI === labwareOnDeck.labwareDefURI &&
        getSlotInLocationStack(stack) ===
          getSlotInLocationStack(labwareOnDeck.stack)
        ? [...acc, id]
        : acc
    },
    []
  )
}
