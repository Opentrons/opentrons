import { useEffect, useState } from 'react'
import some from 'lodash/some'

import {
  ABSORBANCE_READER_V1,
  FLEX_ROBOT_TYPE,
  FLEX_STACKER_V1_FIXTURE,
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  getAreSlotsAdjacent,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  HEATERSHAKER_MODULE_V1,
  OT2_ROBOT_TYPE,
  TEMPERATURE_MODULE_V2,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
  VACUUM_MODULE_TYPE,
  VACUUM_MODULE_V1,
} from '@opentrons/shared-data'
import { getIsVacuumSpacer, getSlotInLocationStack } from '@opentrons/step-generation'

import {
  getIsAdapter,
  getModuleIdFromStack,
  getStagingAreaAddressableAreas,
} from '../../../utils'
import {
  getLabwareIsCompatible,
  getLabwareIsCustom,
} from '../../../utils/labwareModuleCompatibility'
import {
  FLEX_MODULE_MODELS,
  OT2_MODULE_MODELS,
  RECOMMENDED_LABWARE_BY_MODULE,
} from './constants'

import type { Dispatch, SetStateAction } from 'react'
import type {
  AddressableAreaName,
  CutoutFixture,
  CutoutId,
  DeckDefinition,
  DeckSlotId,
  LabwareDefinition2,
  ModuleModel,
  ModuleType,
  RobotType,
} from '@opentrons/shared-data'
import type { LabwareDefByDefURI } from '../../../labware-defs'
import type {
  AllTemporalPropertiesForTimelineFrame,
  InitialDeckSetup,
  LabwareOnDeck,
  ModuleOnDeck,
  SavedStepFormState,
} from '../../../step-forms'
import type { Selection } from '../../../ui/steps'
import type { Fixture } from './constants'

const OT2_TC_SLOTS = ['7', '8', '10', '11']
const FLEX_TC_SLOTS = ['A1', 'B1']

export type ModuleModelExtended = ModuleModel | 'stagingAreaAndMagneticBlock'

/**
 * Check if a labware definition is that of a vacuum module collar
 * @param labwareDef - The labware definition to check
 * @returns True if the labware definition is a vacuum module collar, false otherwise
 */
export function getIsVacuumCollar(labwareDef: LabwareDefinition2): boolean {
  const loadName = labwareDef.parameters.loadName
  return (
    loadName === 'opentrons_vacuum_manifold_collar_tall' ||
    loadName === 'opentrons_vacuum_manifold_collar_short'
  )
}

export { getIsVacuumSpacer } from '@opentrons/step-generation'

export function getCutoutIdForAddressableArea(
  addressableArea: AddressableAreaName,
  cutoutFixtures: CutoutFixture[]
): CutoutId | null {
  return cutoutFixtures.reduce<CutoutId | null>((acc, cutoutFixture) => {
    const [cutoutId] =
      Object.entries(cutoutFixture.providesAddressableAreas).find(
        ([_cutoutId, providedAAs]) => providedAAs.includes(addressableArea)
      ) ?? []
    return (cutoutId as CutoutId) ?? acc
  }, null)
}

export function getModuleModelsBySlot(
  robotType: RobotType,
  slot: DeckSlotId
): ModuleModelExtended[] {
  const FLEX_MIDDLE_SLOTS = new Set(['B2', 'C2', 'A2', 'D2'])
  const OT2_MIDDLE_SLOTS = ['2', '5', '8', '11']

  const FLEX_RIGHT_SLOTS = new Set(['A3', 'B3', 'C3', 'D3'])

  let moduleModels: ModuleModelExtended[] = [
    ...FLEX_MODULE_MODELS,
    'stagingAreaAndMagneticBlock',
  ]

  switch (robotType) {
    case FLEX_ROBOT_TYPE: {
      moduleModels = FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS.includes(
        slot as AddressableAreaName
      )
        ? []
        : [
            ...FLEX_MODULE_MODELS,
            'stagingAreaAndMagneticBlock' as ModuleModelExtended,
          ].filter(model => {
            if (model === THERMOCYCLER_MODULE_V2) {
              return slot === 'B1'
            } else if (model === VACUUM_MODULE_V1) {
              return slot === 'A3'
            } else if (model === ABSORBANCE_READER_V1) {
              return FLEX_RIGHT_SLOTS.has(slot)
            } else if (
              model === TEMPERATURE_MODULE_V2 ||
              model === HEATERSHAKER_MODULE_V1 ||
              model === FLEX_STACKER_V1_FIXTURE
            ) {
              return !FLEX_MIDDLE_SLOTS.has(slot)
            } else if (
              model === ('stagingAreaAndMagneticBlock' as ModuleModelExtended)
            ) {
              return FLEX_RIGHT_SLOTS.has(slot)
            }
            return true
          })
      break
    }
    case OT2_ROBOT_TYPE: {
      if (OT2_MIDDLE_SLOTS.includes(slot)) {
        moduleModels = []
      } else if (slot === '7') {
        moduleModels = OT2_MODULE_MODELS
      } else if (slot === '9') {
        moduleModels = OT2_MODULE_MODELS.filter(
          model =>
            getModuleType(model) !== HEATERSHAKER_MODULE_TYPE &&
            getModuleType(model) !== THERMOCYCLER_MODULE_TYPE
        )
      } else {
        moduleModels = OT2_MODULE_MODELS.filter(
          model => getModuleType(model) !== THERMOCYCLER_MODULE_TYPE
        )
      }
      break
    }
  }
  return moduleModels
}

export const getLabwareIsRecommended = (
  def: LabwareDefinition2,
  moduleModel?: ModuleModel | null,
  moduleHasLabware?: boolean,
  isVacuumDock?: boolean,
  dockHasCollar?: boolean
): boolean => {
  //  special-casing the thermocycler module V2 recommended labware since the thermocyclerModuleTypes
  //  have different recommended labware
  if (moduleModel == null) {
    // permissive early exit if no module passed
    return true
  }

  // For vacuum dock, recommendations depend on whether collar is present
  if (isVacuumDock) {
    if (!dockHasCollar) {
      // No collar is present, so recommend both collars
      return getIsVacuumCollar(def)
    }
    // Collar is present, so recommend tough wellplate
    return (
      def.parameters.loadName === 'opentrons_96_wellplate_200ul_pcr_full_skirt'
    )
  }

  const moduleType = getModuleType(moduleModel)

  // For vacuum module, show different labware based on whether module has labware
  if (moduleType === VACUUM_MODULE_TYPE) {
    if (moduleHasLabware) {
      // Show collars, wellplates, and filter plates when module already has labware
      return (
        def.parameters.loadName ===
          'opentrons_vacuum_manifold_collar_tall' ||
        def.parameters.loadName ===
          'opentrons_vacuum_manifold_collar_short' ||
        def.parameters.loadName ===
          'opentrons_96_wellplate_200ul_pcr_full_skirt' ||
        (def.parameters.quirks ?? []).includes('filterPlate')
      )
    } else {
      // Show spacer and wellplate for empty module
      return RECOMMENDED_LABWARE_BY_MODULE[moduleType].includes(
        def.parameters.loadName
      )
    }
  }

  return moduleModel === THERMOCYCLER_MODULE_V2
    ? def.parameters.loadName === 'opentrons_96_wellplate_200ul_pcr_full_skirt'
    : RECOMMENDED_LABWARE_BY_MODULE[moduleType].includes(
        def.parameters.loadName
      )
}

//  purely for labware<>adapter combos
export const getLabwareCompatibleWithAdapter = (
  defs: LabwareDefByDefURI,
  adapterLoadName?: string
): string[] => {
  if (adapterLoadName == null) {
    return []
  }

  // vacuum spacers expose the same recommended well plates as the bare module
  const adapterDef = Object.values(defs).find(
    d => d.parameters.loadName === adapterLoadName
  )
  if (adapterDef != null && getIsVacuumSpacer(adapterDef)) {
    const vacuumRecommended = RECOMMENDED_LABWARE_BY_MODULE[VACUUM_MODULE_TYPE]
    return Object.entries(defs)
      .filter(
        ([, def]) =>
          vacuumRecommended.includes(def.parameters.loadName) &&
          !getIsVacuumSpacer(def) &&
          !getIsVacuumCollar(def)
      )
      .map(([uri]) => uri)
  }

  return Object.entries(defs)
    .filter(
      ([, def]) =>
        def.stackingOffsetWithLabware?.[adapterLoadName] != null ||
        (def.parameters.quirks ?? []).includes('filterPlate')
    )
    .map(([labwareDefUri]) => labwareDefUri)
}

const _stackTopIsNonAdapter = (
  labwareStack: string[],
  deckSetupLabware: AllTemporalPropertiesForTimelineFrame['labware']
): boolean => {
  const topDef =
    labwareStack.length > 0
      ? deckSetupLabware[labwareStack[0]]?.def
      : null
  return topDef != null && !topDef.allowedRoles?.includes('adapter')
}

export const getIsVacuumModuleFull = (
  labwareStack: string[],
  deckSetupLabware: AllTemporalPropertiesForTimelineFrame['labware']
): boolean => {
  // Full only when a non-adapter (filter plate/wellplate) sits on top of a collar.
  // A base plate alone (no collar) or a collar alone does not make the module full.
  const hasCollar = labwareStack.some(labwareId => {
    const def = deckSetupLabware[labwareId]?.def
    return def != null && getIsVacuumCollar(def)
  })
  return _stackTopIsNonAdapter(labwareStack, deckSetupLabware) && hasCollar
}

export const getIsVacuumDockFull = (
  adapterLabwareId: string | null,
  labwareStack: string[],
  deckSetupLabware: AllTemporalPropertiesForTimelineFrame['labware']
): boolean => {
  // Full only when a non-adapter sits on top of a collar in the dock.
  // A collar alone does not make the dock full.
  const adapterIsCollar =
    adapterLabwareId != null &&
    deckSetupLabware[adapterLabwareId]?.def != null &&
    getIsVacuumCollar(deckSetupLabware[adapterLabwareId].def)
  return adapterIsCollar && _stackTopIsNonAdapter(labwareStack, deckSetupLabware)
}

const getStackerDefinitionsFromLoadName = (
  defs: LabwareDefByDefURI,
  loadName: string
): string[] | null => {
  const matchingLabwares: Array<{
    labwareDefUri: string
    loadName: string
  }> = Object.entries(defs)
    .filter(([, { compatibleParentLabware }]) =>
      compatibleParentLabware?.includes(loadName)
    )
    .reverse()
    .map(([labwareDefUri, def]) => ({
      labwareDefUri,
      loadName: def.parameters.loadName,
    }))

  //  TODO: remove this when we allow stacking of the Opentrons Tough plate on itself
  //  in PD
  if (loadName === 'opentrons_96_wellplate_200ul_pcr_full_skirt') {
    return matchingLabwares.reduce((acc: string[], labware) => {
      if (labware.loadName !== loadName) {
        acc.push(labware.labwareDefUri)
      }
      return acc
    }, [])
  }

  return matchingLabwares.map(labware => labware.labwareDefUri)
}

const CATEGORIES_WITH_NO_LID = [
  'lid',
  'tubeRack',
  'tipRack',
  'adapter',
  'aluminumBlock',
]
export const getStackerDefinitions = (
  defs: LabwareDefByDefURI,
  universalLidURI?: string,
  loadName?: string,
  category?: string
): string[] => {
  if (loadName == null || loadName === 'opentrons_flex_deck_riser') {
    return []
  }
  const universalLid =
    (category != null && !CATEGORIES_WITH_NO_LID.includes(category)) ||
    loadName === 'opentrons_tough_universal_lid'
      ? universalLidURI
      : null
  const supportedDefs = getStackerDefinitionsFromLoadName(defs, loadName)
  return [
    ...(supportedDefs != null ? supportedDefs : []),
    ...(universalLid != null ? [universalLid] : []),
  ]
}
interface DeckErrorsProps {
  modules: InitialDeckSetup['modules']
  selectedSlot: string
  selectedModel: ModuleModel
  labware: InitialDeckSetup['labware']
  robotType: RobotType
}

export const getDeckErrors = (props: DeckErrorsProps): string | null => {
  const { selectedSlot, selectedModel, modules, labware, robotType } = props

  let error = null

  if (robotType === OT2_ROBOT_TYPE) {
    const isModuleAdjacentToHeaterShaker =
      // modules can't be adjacent to heater shakers
      getModuleType(selectedModel) !== HEATERSHAKER_MODULE_TYPE &&
      some(
        modules,
        hwModule =>
          hwModule.type === HEATERSHAKER_MODULE_TYPE &&
          getAreSlotsAdjacent(hwModule.slot, selectedSlot)
      )

    if (isModuleAdjacentToHeaterShaker) {
      error = 'heater_shaker_adjacent'
    } else if (getModuleType(selectedModel) === HEATERSHAKER_MODULE_TYPE) {
      const isHeaterShakerAdjacentToAnotherModule = some(
        modules,
        hwModule =>
          getAreSlotsAdjacent(hwModule.slot, selectedSlot) &&
          // if the module is a heater shaker, it can't be adjacent to another module
          hwModule.type !== HEATERSHAKER_MODULE_TYPE
      )
      if (isHeaterShakerAdjacentToAnotherModule) {
        error = 'heater_shaker_adjacent_to'
      }
    } else if (getModuleType(selectedModel) === THERMOCYCLER_MODULE_TYPE) {
      const isLabwareInTCSlots = Object.values(labware).some(lw =>
        OT2_TC_SLOTS.includes(getSlotInLocationStack(lw.stack))
      )
      if (isLabwareInTCSlots) {
        error = 'tc_slots_occupied_ot2'
      }
    }
  } else {
    if (getModuleType(selectedModel) === THERMOCYCLER_MODULE_TYPE) {
      const isLabwareInTCSlots = Object.values(labware).some(lw =>
        FLEX_TC_SLOTS.includes(getSlotInLocationStack(lw.stack))
      )
      if (isLabwareInTCSlots) {
        error = 'tc_slots_occupied_flex'
      }
    }
  }

  return error
}

interface ZoomInOnCoordinateProps {
  x: number
  y: number
  deckDef: DeckDefinition
}
export function zoomInOnCoordinate(props: ZoomInOnCoordinateProps): string {
  const { x, y, deckDef } = props
  const [width, height] = [deckDef.dimensions[0], deckDef.dimensions[1]]

  const zoomFactor = 0.55
  const newWidth = width * zoomFactor
  const newHeight = height * zoomFactor

  //  +20 to get the approximate center of the screen point
  const newMinX = x - newWidth / 2 + 20
  const newMinY = y - newHeight / 2

  return `${newMinX} ${newMinY} ${newWidth} ${newHeight + 70}`
}

export interface AnimateZoomProps {
  targetViewBox: string
  viewBox: string
  setViewBox: Dispatch<SetStateAction<string>>
}

type ViewBox = [number, number, number, number]

export function animateZoom(props: AnimateZoomProps): void {
  const { targetViewBox, viewBox, setViewBox } = props

  if (targetViewBox === viewBox) return

  const duration = 500
  const start = performance.now()
  const initialViewBoxValues = viewBox.split(' ').map(Number) as ViewBox
  const targetViewBoxValues = targetViewBox.split(' ').map(Number) as ViewBox

  const animate = (time: number): void => {
    const elapsed = time - start
    const progress = Math.min(elapsed / duration, 1)

    const interpolatedViewBox = initialViewBoxValues.map(
      (start, index) => start + progress * (targetViewBoxValues[index] - start)
    )

    setViewBox(interpolatedViewBox.join(' '))

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  requestAnimationFrame(animate)
}

export const getAdjacentLabware = (
  fixture: Fixture,
  cutout: CutoutId,
  labware: AllTemporalPropertiesForTimelineFrame['labware']
): LabwareOnDeck | null => {
  let adjacentLabware: LabwareOnDeck | null = null
  if (fixture === 'stagingArea' || fixture === 'wasteChuteAndStagingArea') {
    const stagingAreaAddressableAreaName = getStagingAreaAddressableAreas([
      cutout,
    ])

    adjacentLabware =
      Object.values(labware).find(
        lw =>
          getSlotInLocationStack(lw.stack) === stagingAreaAddressableAreaName[0]
      ) ?? null
  }
  return adjacentLabware
}

export const getAdjacentSlots = (
  fixture: Fixture,
  cutout: CutoutId
): AddressableAreaName[] | null => {
  if (fixture === 'stagingArea' || fixture === 'wasteChuteAndStagingArea') {
    const stagingAreaAddressableAreaNames = getStagingAreaAddressableAreas(
      [cutout],
      false
    )
    return stagingAreaAddressableAreaNames
  }
  return null
}

type BreakPoint = 'small' | 'medium' | 'large'

export function useDeckSetupWindowBreakPoint(): BreakPoint {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleResize = (): void => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  let size: BreakPoint = 'large'
  if (windowSize.width <= 1024 && windowSize.width > 800) {
    size = 'medium'
  } else if (windowSize.width <= 800) {
    size = 'small'
  }

  return size
}

export interface SwapBlockedModuleArgs {
  modulesById: InitialDeckSetup['modules']
  customLabwareDefs: LabwareDefByDefURI
  hoveredLabware?: LabwareOnDeck | null
  draggedLabware?: LabwareOnDeck | null
}

export const getSwapBlockedModule = (args: SwapBlockedModuleArgs): boolean => {
  const { hoveredLabware, draggedLabware, modulesById, customLabwareDefs } =
    args

  if (!hoveredLabware || !draggedLabware) {
    return false
  }

  const sourceModuleId = getModuleIdFromStack(draggedLabware.stack, modulesById)
  const destModuleId = getModuleIdFromStack(hoveredLabware.stack, modulesById)
  const sourceModuleType: ModuleType | null =
    sourceModuleId != null ? modulesById[sourceModuleId].type : null

  const destModuleType: ModuleType | null =
    destModuleId != null ? modulesById[destModuleId].type : null

  const draggedLabwareIsCustom = getLabwareIsCustom(
    customLabwareDefs,
    draggedLabware
  )
  const hoveredLabwareIsCustom = getLabwareIsCustom(
    customLabwareDefs,
    hoveredLabware
  )

  // dragging custom labware to module gives no compat error
  const labwareSourceToDestBlocked = sourceModuleType
    ? !getLabwareIsCompatible(hoveredLabware.def, sourceModuleType) &&
      !hoveredLabwareIsCustom
    : false
  const labwareDestToSourceBlocked = destModuleType
    ? !getLabwareIsCompatible(draggedLabware.def, destModuleType) &&
      !draggedLabwareIsCustom
    : false

  return labwareSourceToDestBlocked || labwareDestToSourceBlocked
}

export interface SwapBlockedAdapterArgs {
  labwareById: InitialDeckSetup['labware']
  hoveredLabware?: LabwareOnDeck | null
  draggedLabware?: LabwareOnDeck | null
}

export const getSwapBlockedAdapter = (
  args: SwapBlockedAdapterArgs
): boolean => {
  const { hoveredLabware, draggedLabware, labwareById } = args

  if (!hoveredLabware || !draggedLabware) {
    return false
  }

  const adapterSourceToDestLoadname: string | null =
    labwareById[draggedLabware.stack[1]]?.def.parameters.loadName ?? null
  const adapterDestToSourceLoadname: string | null =
    labwareById[hoveredLabware.stack[1]]?.def.parameters.loadName ?? null

  const labwareSourceToDestBlocked =
    adapterSourceToDestLoadname != null
      ? hoveredLabware.def.stackingOffsetWithLabware?.[
          adapterSourceToDestLoadname
        ] == null
      : false
  const labwareDestToSourceBlocked =
    adapterDestToSourceLoadname != null
      ? draggedLabware.def.stackingOffsetWithLabware?.[
          adapterDestToSourceLoadname
        ] == null
      : false

  return labwareSourceToDestBlocked || labwareDestToSourceBlocked
}

export const getSVGContainerWidth = (
  robotType: RobotType,
  isZoomed: boolean
): string => {
  if (robotType === OT2_ROBOT_TYPE && !isZoomed) {
    return '78.5%'
  }
  return '100%'
}

interface HighlightItemsByType {
  highlightModuleItems: Array<{
    selection: Selection
    module: ModuleOnDeck
    isSelected?: boolean
  }>
  highlightLabwareItems: Array<{
    selection: Selection
    labware: LabwareOnDeck
    isSelected?: boolean
  }>
}

export function getHighlightLabwareAndModules(
  hoveredItem: Selection,
  selectedDropdownItems: Selection[],
  labware: Record<string, LabwareOnDeck>,
  modules: Record<string, ModuleOnDeck>
): HighlightItemsByType {
  const _getReducedHighlightItemsById = (
    items: Selection[],
    isSelected: boolean
  ): Record<string, { item: Selection; isSelected: boolean }> => {
    return items.reduce((acc, item) => {
      if (item.id != null) {
        const moduleIdUnderLabwareToUse =
          item.id != null &&
          labware[item.id] != null &&
          getIsAdapter(item.id, labware) &&
          // collars are unique adapters in that they can be moved around the deck
          !getIsVacuumCollar(labware[item.id].def)
            ? getModuleIdFromStack(labware[item.id].stack, modules)
            : null

        const updatedItem =
          moduleIdUnderLabwareToUse != null
            ? { ...item, id: moduleIdUnderLabwareToUse }
            : item

        return updatedItem.id != null
          ? { ...acc, [updatedItem.id]: { item: updatedItem, isSelected } }
          : acc
      }
      return acc
    }, {})
  }

  const reducedHoveredItemsById = _getReducedHighlightItemsById(
    [hoveredItem],
    false
  )
  const reducedSelectedItemsById = _getReducedHighlightItemsById(
    selectedDropdownItems,
    true
  )
  const dropdownModulesAndLabwareItemsById = {
    ...reducedHoveredItemsById,
    ...reducedSelectedItemsById,
  }

  const highlightItems = Object.values(
    dropdownModulesAndLabwareItemsById
  ).reduce<HighlightItemsByType>(
    (acc, { item, isSelected }) => {
      const { id } = item
      if (id == null) {
        return acc
      }
      if (id in modules) {
        const moduleOnDeck = modules[id]
        return {
          ...acc,
          highlightModuleItems: [
            ...acc.highlightModuleItems,
            { module: moduleOnDeck, selection: item, isSelected },
          ],
        }
      }
      if (id in labware) {
        const labwareOnDeck = labware[id]
        return {
          ...acc,
          highlightLabwareItems: [
            ...acc.highlightLabwareItems,
            { labware: labwareOnDeck, selection: item, isSelected },
          ],
        }
      }
      return acc
    },
    {
      highlightModuleItems: [],
      highlightLabwareItems: [],
    }
  )
  return highlightItems
}

export const getIsLabwareInUse = (
  savedSteps: SavedStepFormState,
  labware?: LabwareOnDeck | null
): boolean => {
  return (
    labware != null &&
    Object.values(savedSteps).find(
      step =>
        //  moveLabware && mixing in the labware
        ('labware' in step && step.labware === labware.id) ||
        //  moving labware to new location
        ('newLocation' in step && step.newLocation === labware.id) ||
        // moveLiquid in the labware
        ('aspirate_labware' in step && step.aspirate_labware === labware.id) ||
        //  moveLiquid in the labware
        ('dispense_labware' in step && step.dispense_labware === labware.id)
    ) != null
  )
}

export function getIsLabwareOnSlotInUse(
  savedSteps: SavedStepFormState,
  createdAdapterForSlot?: LabwareOnDeck,
  createdTopLabwareForSlot?: LabwareOnDeck
): boolean {
  const isCurrentLabwareInUse = [
    createdAdapterForSlot,
    createdTopLabwareForSlot,
  ]
    .map(lw => getIsLabwareInUse(savedSteps, lw))
    .includes(true)

  return isCurrentLabwareInUse
}
