import some from 'lodash/some'
import {
  getAreSlotsAdjacent,
  getAreSlotsHorizontallyAdjacent,
  getIsLabwareAboveHeight,
  HEATERSHAKER_MODULE_TYPE,
  MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM,
  PipetteNameSpecs,
} from '@opentrons/shared-data'
import type { LabwareEntities, RobotState, DeckSlot } from '../types'

export const getIsHeaterShakerEastWestWithLatchOpen = (
  hwModules: RobotState['modules'],
  slot: DeckSlot
): boolean =>
  some(
    hwModules,
    hwModule =>
      hwModule.moduleState.type === HEATERSHAKER_MODULE_TYPE &&
      hwModule.moduleState.latchOpen === true &&
      getAreSlotsHorizontallyAdjacent(hwModule.slot, slot)
  )

export const getIsHeaterShakerEastWestMultiChannelPipette = (
  hwModules: RobotState['modules'],
  slot: DeckSlot,
  pipetteSpecs: PipetteNameSpecs
): boolean =>
  pipetteSpecs.channels !== 1 &&
  some(
    hwModules,
    hwModule =>
      hwModule.moduleState.type === HEATERSHAKER_MODULE_TYPE &&
      getAreSlotsHorizontallyAdjacent(hwModule.slot, slot)
  )

export const getIsTallLabwareEastWestOfHeaterShaker = (
  labwareState: RobotState['labware'],
  labwareEntities: LabwareEntities,
  heaterShakerSlot: string
): boolean => {
  const isTallLabwareEastWestOfHeaterShaker = some(
    labwareState,
    (labwareProperties, labwareId) =>
      getAreSlotsHorizontallyAdjacent(
        heaterShakerSlot,
        labwareProperties.slot
      ) &&
      getIsLabwareAboveHeight(
        labwareEntities[labwareId].def,
        MAX_LABWARE_HEIGHT_EAST_WEST_HEATER_SHAKER_MM
      )
  )
  return isTallLabwareEastWestOfHeaterShaker
}

export const pipetteIntoHeaterShakerLatchOpen = (
  modules: RobotState['modules'],
  labware: RobotState['labware'],
  labwareId: string
): boolean => {
  const labwareSlot: string = labware[labwareId]?.slot
  const moduleUnderLabware: string | null | undefined =
    modules &&
    labwareSlot &&
    Object.keys(modules).find((moduleId: string) => moduleId === labwareSlot)
  const moduleState =
    moduleUnderLabware && modules[moduleUnderLabware].moduleState
  const isHSLatchOpen: boolean = Boolean(
    moduleState &&
      moduleState.type === HEATERSHAKER_MODULE_TYPE &&
      moduleState.latchOpen !== false
  )
  return isHSLatchOpen
}

export const pipetteAdjacentHeaterShakerWhileShaking = (
  hwModules: RobotState['modules'],
  slot: DeckSlot
): boolean =>
  some(
    hwModules,
    hwModule =>
      hwModule.moduleState.type === HEATERSHAKER_MODULE_TYPE &&
      hwModule.moduleState.targetSpeed != null &&
      hwModule.moduleState.targetSpeed > 0 &&
      getAreSlotsAdjacent(hwModule.slot, slot)
  )

export const pipetteIntoHeaterShakerWhileShaking = (
  modules: RobotState['modules'],
  labware: RobotState['labware'],
  labwareId: string
): boolean => {
  const labwareSlot: string = labware[labwareId]?.slot
  const moduleUnderLabware: string | null | undefined =
    modules &&
    labwareSlot &&
    Object.keys(modules).find((moduleId: string) => moduleId === labwareSlot)
  const moduleState =
    moduleUnderLabware && modules[moduleUnderLabware].moduleState
  const isShaking: boolean = Boolean(
    moduleState &&
      moduleState.type === HEATERSHAKER_MODULE_TYPE &&
      moduleState.targetSpeed !== null
  )
  return isShaking
}
