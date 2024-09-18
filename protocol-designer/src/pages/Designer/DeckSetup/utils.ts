import some from 'lodash/some'
import {
  FLEX_ROBOT_TYPE,
  FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS,
  HEATERSHAKER_MODULE_TYPE,
  MAGNETIC_BLOCK_V1,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
  getAreSlotsAdjacent,
  getModuleType,
} from '@opentrons/shared-data'

import { getOnlyLatestDefs } from '../../../labware-defs'
import {
  FLEX_MODULE_MODELS,
  OT2_MODULE_MODELS,
  RECOMMENDED_LABWARE_BY_MODULE,
} from './constants'

import type {
  AddressableAreaName,
  CutoutFixture,
  CutoutId,
  DeckDefinition,
  DeckSlotId,
  LabwareDefinition2,
  ModuleModel,
  RobotType,
} from '@opentrons/shared-data'
import type { InitialDeckSetup } from '../../../step-forms'

const OT2_TC_SLOTS = ['7', '8', '10', '11']
const FLEX_TC_SLOTS = ['A1', 'B1']

export function getCutoutIdForAddressableArea(
  addressableArea: AddressableAreaName,
  cutoutFixtures: CutoutFixture[]
): CutoutId | null {
  return cutoutFixtures.reduce<CutoutId | null>((acc, cutoutFixture) => {
    const [cutoutId] =
      Object.entries(
        cutoutFixture.providesAddressableAreas
      ).find(([_cutoutId, providedAAs]) =>
        providedAAs.includes(addressableArea)
      ) ?? []
    return (cutoutId as CutoutId) ?? acc
  }, null)
}

export function getModuleModelsBySlot(
  enableAbsorbanceReader: boolean,
  robotType: RobotType,
  slot: DeckSlotId
): ModuleModel[] {
  const FLEX_MIDDLE_SLOTS = ['B2', 'C2', 'A2', 'D2']
  const OT2_MIDDLE_SLOTS = ['2', '5', '8', '11']

  let moduleModels: ModuleModel[] = enableAbsorbanceReader
    ? FLEX_MODULE_MODELS.filter(model => model !== 'absorbanceReaderV1')
    : FLEX_MODULE_MODELS

  switch (robotType) {
    case FLEX_ROBOT_TYPE: {
      if (slot !== 'B1' && !FLEX_MIDDLE_SLOTS.includes(slot)) {
        moduleModels = FLEX_MODULE_MODELS.filter(
          model => model !== THERMOCYCLER_MODULE_V2
        )
      }
      if (FLEX_MIDDLE_SLOTS.includes(slot)) {
        moduleModels = FLEX_MODULE_MODELS.filter(
          model => model === MAGNETIC_BLOCK_V1
        )
      }
      if (
        FLEX_STAGING_AREA_SLOT_ADDRESSABLE_AREAS.includes(
          slot as AddressableAreaName
        )
      ) {
        moduleModels = []
      }
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
  moduleModel?: ModuleModel | null
): boolean => {
  //  special-casing the thermocycler module V2 recommended labware since the thermocyclerModuleTypes
  //  have different recommended labware
  const moduleType = moduleModel != null ? getModuleType(moduleModel) : null
  if (moduleModel === THERMOCYCLER_MODULE_V2) {
    return (
      def.parameters.loadName === 'opentrons_96_wellplate_200ul_pcr_full_skirt'
    )
  } else {
    return moduleType != null
      ? RECOMMENDED_LABWARE_BY_MODULE[moduleType].includes(
          def.parameters.loadName
        )
      : false
  }
}

export const getLabwareCompatibleWithAdapter = (
  adapterLoadName?: string
): string[] => {
  const defs = getOnlyLatestDefs()

  if (adapterLoadName == null) {
    return []
  }

  return Object.entries(defs)
    .filter(
      ([, { stackingOffsetWithLabware }]) =>
        stackingOffsetWithLabware?.[adapterLoadName] != null
    )
    .map(([labwareDefUri]) => labwareDefUri)
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
        OT2_TC_SLOTS.includes(lw.slot)
      )
      if (isLabwareInTCSlots) {
        error = 'tc_slots_occupied_ot2'
      }
    }
  } else {
    if (getModuleType(selectedModel) === THERMOCYCLER_MODULE_TYPE) {
      const isLabwareInTCSlots = Object.values(labware).some(lw =>
        FLEX_TC_SLOTS.includes(lw.slot)
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

  const zoomFactor = 0.6
  const newWidth = width * zoomFactor
  const newHeight = height * zoomFactor

  //  +125 and +50 to get the approximate center of the screen point
  const newMinX = x - newWidth / 2 + 125
  const newMinY = y - newHeight / 2 + 50

  return `${newMinX} ${newMinY} ${newWidth} ${newHeight}`
}

export interface AnimateZoomProps {
  targetViewBox: string
  viewBox: string
  setViewBox: React.Dispatch<React.SetStateAction<string>>
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
