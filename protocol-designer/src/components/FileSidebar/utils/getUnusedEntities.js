// @flow
import reduce from 'lodash/reduce'
import some from 'lodash/some'

import type { SavedStepFormState } from '../../../step-forms'

/** Pull out all entities never specified by step forms. Assumes that all forms share the entityKey */
export function getUnusedEntities<T>(
  entities: { [entityId: string]: T },
  stepForms: SavedStepFormState,
  entityKey: 'pipette' | 'moduleId'
): Array<T> {
  return reduce(
    entities,
    (acc, entity, entityId): Array<T> => {
      const stepContainsEntity = some(
        stepForms,
        form => form[entityKey] === entityId
      )
      return stepContainsEntity ? acc : [...acc, entity]
    },
    []
  )
}
