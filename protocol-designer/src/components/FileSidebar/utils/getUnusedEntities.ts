import some from 'lodash/some'
import reduce from 'lodash/reduce'
import type { SavedStepFormState } from '../../../step-forms'

/** Pull out all entities never specified by step forms. Assumes that all forms share the entityKey */
export function getUnusedEntities<T>(
  entities: Record<string, T>,
  stepForms: SavedStepFormState,
  entityKey: 'pipette' | 'moduleId'
): T[] {
  const a = reduce(
    entities,
    (acc, entity: T, entityId): T[] => {
      const stepContainsEntity = some(
        stepForms,
        form => form[entityKey] === entityId
      )
      return stepContainsEntity ? acc : [...acc, entity]
    },
    [] as T[]
  )
  return a
}
