import some from 'lodash/some'
import reduce from 'lodash/reduce'
import type { RobotType } from '@opentrons/shared-data'
import type { SavedStepFormState } from '../../../step-forms'

/** Pull out all entities never specified by step forms. Assumes that all forms share the entityKey */
export function getUnusedEntities<T>(
  entities: Record<string, T>,
  stepForms: SavedStepFormState,
  entityKey: 'pipette' | 'moduleId',
  robotType: RobotType
): T[] {
  const unusedEntities = reduce(
    entities,
    (acc, entity: T, entityId): T[] => {
      const stepContainsEntity = some(
        stepForms,
        form => form[entityKey] === entityId
      )

      if (
        robotType === 'OT-3 Standard' &&
        entityKey === 'moduleId' &&
        (entity as any).type === 'magneticBlockType'
      ) {
        return acc
      }

      return stepContainsEntity ? acc : [...acc, entity]
    },
    [] as T[]
  )

  return unusedEntities
}
