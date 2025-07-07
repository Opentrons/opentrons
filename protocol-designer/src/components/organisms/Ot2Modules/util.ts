import type { ModuleOnDeck, SavedStepFormState } from '../../../step-forms'

interface ModuleOnSlot {
  isModuleInUse: boolean
  moduleId: string
}
//  NOTE: used for the OT-2, returns the moduleId and if its in use or not
export function getModuleOnSlot(
  savedSteps: SavedStepFormState,
  moduleOnDeck: ModuleOnDeck
): ModuleOnSlot {
  const isModuleInUse =
    Object.values(savedSteps).find(
      step =>
        //  module step
        ('moduleId' in step && step.moduleId === moduleOnDeck.id) ||
        //  moving labware to the module
        ('newLocation' in step && step.newlocation === moduleOnDeck.id) ||
        //  moving a labware from the module location
        ('labware' in step && step.labware === moduleOnDeck.id)
    ) != null
  return { isModuleInUse, moduleId: moduleOnDeck.id }
}
