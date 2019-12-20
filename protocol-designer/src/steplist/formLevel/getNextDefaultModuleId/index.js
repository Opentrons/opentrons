// @flow
import findKey from 'lodash/findKey'
import last from 'lodash/last'
import type { ModuleOnDeck } from '../../../step-forms'
import type { StepIdType, FormData } from '../../../form-types'

export function getNextDefaultTemperatureModuleId(
  savedForms: { [StepIdType]: FormData },
  orderedStepIds: Array<StepIdType>,
  equippedModulesById: { [moduleId: string]: ModuleOnDeck }
): string {
  const prevModuleSteps = orderedStepIds
    .map(stepId => savedForms[stepId])
    .filter(form => form && form.moduleId)

  const lastModuleStep = last(prevModuleSteps)

  // TODO (ka 2019-12-20): Since we are hiding the thermocylcer module as an option for now,
  // should we simplify this to only return temperature modules?
  const nextDefaultModule: ?string =
    (lastModuleStep && lastModuleStep.moduleId) ||
    findKey(equippedModulesById, m => m.type === 'tempdeck') ||
    findKey(equippedModulesById, m => m.type === 'thermocycler')

  if (!nextDefaultModule) {
    console.error('Could not get next default module. Something went wrong.')
    return ''
  }

  return nextDefaultModule
}
