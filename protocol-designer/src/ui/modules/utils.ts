import values from 'lodash/values'
import {
  MAGNETIC_MODULE_V1,
  getLabwareDefaultEngageHeight,
  ModuleType,
} from '@opentrons/shared-data'
import { Options } from '@opentrons/components'
import type {
  ModuleOnDeck,
  LabwareOnDeck,
  InitialDeckSetup,
} from '../../step-forms/types'
import type { SavedStepFormState } from '../../step-forms'

export function getModuleOnDeckByType(
  initialDeckSetup: InitialDeckSetup,
  type: ModuleType
): ModuleOnDeck | null | undefined {
  return values(initialDeckSetup.modules).find(
    (moduleOnDeck: ModuleOnDeck) => moduleOnDeck.type === type
  )
}
export function getLabwareOnModule(
  initialDeckSetup: InitialDeckSetup,
  moduleId: string
): LabwareOnDeck | null | undefined {
  return values(initialDeckSetup.labware).find(
    (lab: LabwareOnDeck) => lab.slot === moduleId
  )
}
export function getModuleUnderLabware(
  initialDeckSetup: InitialDeckSetup,
  savedStepFormState: SavedStepFormState,
  labwareId: string
): ModuleOnDeck | null | undefined {
  //  latest moveLabware step related to labwareId
  const moveLabwareStep = Object.values(savedStepFormState)
    .filter(
      state =>
        state.stepType === 'moveLabware' &&
        labwareId != null &&
        state.labware === labwareId
    )
    .reverse()[0]
  const newLocation = moveLabwareStep?.newLocation

  return values(initialDeckSetup.modules).find((moduleOnDeck: ModuleOnDeck) => {
    const labwareSlot = initialDeckSetup.labware[labwareId]?.slot
    let location
    if (newLocation != null) {
      location = newLocation
    } else if (
      labwareSlot != null &&
      initialDeckSetup.labware[labwareSlot] != null
    ) {
      location = initialDeckSetup.labware[labwareSlot].slot
    } else {
      location = labwareSlot
    }
    return location === moduleOnDeck.id
  })
}

export const getModuleShortNames = (type: ModuleType): string => {
  switch (type) {
    case 'heaterShakerModuleType':
      return 'Heater-Shaker'
    case 'magneticBlockType':
      return 'Magnetic Block'
    case 'magneticModuleType':
      return 'Magnetic Module'
    case 'temperatureModuleType':
      return 'Temperature Module'
    case 'thermocyclerModuleType':
      return 'Thermocycler'
  }
}

export function getModuleLabwareOptions(
  initialDeckSetup: InitialDeckSetup,
  nicknamesById: Record<string, string>,
  type: ModuleType
): Options {
  const moduleOnDeck = getModuleOnDeckByType(initialDeckSetup, type)
  const labware =
    moduleOnDeck && getLabwareOnModule(initialDeckSetup, moduleOnDeck.id)
  const module = getModuleShortNames(type)
  let options: Options = []

  if (moduleOnDeck) {
    if (labware) {
      options = [
        {
          name: `${nicknamesById[labware.id]} in ${module}`,
          value: moduleOnDeck.id,
        },
      ]
    } else {
      options = [
        {
          name: `${module} No labware on module`,
          value: moduleOnDeck.id,
        },
      ]
    }
  }

  return options
}
export function getModuleHasLabware(
  initialDeckSetup: InitialDeckSetup,
  type: ModuleType
): boolean {
  const moduleOnDeck = getModuleOnDeckByType(initialDeckSetup, type)
  const labware =
    moduleOnDeck && getLabwareOnModule(initialDeckSetup, moduleOnDeck.id)
  return Boolean(moduleOnDeck) && Boolean(labware)
}
export const getMagnetLabwareEngageHeight = (
  initialDeckSetup: InitialDeckSetup,
  magnetModuleId: string | null
): number | null => {
  if (magnetModuleId == null) return null
  const moduleModel = initialDeckSetup.modules[magnetModuleId]?.model
  const labware = getLabwareOnModule(initialDeckSetup, magnetModuleId)
  const engageHeightMm = labware
    ? getLabwareDefaultEngageHeight(labware.def)
    : null

  if (engageHeightMm != null && moduleModel === MAGNETIC_MODULE_V1) {
    // convert to 'short mm' units for GEN1
    return engageHeightMm * 2
  }

  return engageHeightMm
}
