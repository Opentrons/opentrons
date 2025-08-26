import { getIsLabwareInUse } from '/protocol-designer/pages/Designer/DeckSetup/utils'

import type { AdditionalEquipmentEntity } from '@opentrons/step-generation'
import type {
  LabwareOnDeck,
  ModuleOnDeck,
  SavedStepFormState,
} from '/protocol-designer/step-forms'

interface HardwareInSlotInfo {
  moduleId: string | null
  fixtureIds: string[] | null
  fourthColumnSlotLabwareId: string | null
}

export function getHardwareInSlotInUse(
  savedSteps: SavedStepFormState,
  matchingLabwareFor4thColumn: LabwareOnDeck | null,
  moduleOnDeck?: ModuleOnDeck,
  fixturesOnDeck?: AdditionalEquipmentEntity[]
): HardwareInSlotInfo {
  const isModuleInUse =
    moduleOnDeck != null &&
    Object.values(savedSteps).some(
      step =>
        //  module step
        ('moduleId' in step && step.moduleId === moduleOnDeck.id) ||
        //  moving labware to the module
        ('newLocation' in step && step.newlocation === moduleOnDeck.id) ||
        //  moving a labware from the module location
        ('labware' in step && step.labware === moduleOnDeck.id)
    )
  const isLabwareInUse =
    matchingLabwareFor4thColumn != null
      ? getIsLabwareInUse(savedSteps, matchingLabwareFor4thColumn)
      : false

  const isFixtureInUse =
    fixturesOnDeck != null &&
    fixturesOnDeck.length > 0 &&
    Object.values(savedSteps).some(
      step =>
        //  mix & moveLiquid
        ('dropTip_location' in step &&
          fixturesOnDeck.some(
            fixture => fixture.id === step.dropTip_location
          )) ||
        //  dispensing in trash
        ('dispense_labware' in step &&
          fixturesOnDeck.some(
            fixture => fixture.id === step.dispense_labware
          )) ||
        //  moving to wasteChute or 4th column slot
        ('newLocation' in step &&
          fixturesOnDeck.some(fixture => fixture.location === step.newLocation))
    )
  const fixtureIds =
    fixturesOnDeck != null ? fixturesOnDeck.map(fixture => fixture.id) : null

  return {
    moduleId: isModuleInUse ? moduleOnDeck.id : null,
    fixtureIds: isFixtureInUse ? fixtureIds : null,
    fourthColumnSlotLabwareId: isLabwareInUse
      ? matchingLabwareFor4thColumn?.id ?? null
      : null,
  }
}
