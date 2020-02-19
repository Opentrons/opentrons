// @flow

import _ from 'lodash'
import type {
  PipetteDisplayProperties,
  ModuleEntities,
} from '../../../step-forms'

export function getUnusedEntities(
  entities: PipetteDisplayProperties | ModuleEntities,
  commands: any,
  paramKey: string
): Array<any> {
  return _(entities)
    .map((entity, entityId) => {
      const stepContainingEntry = _.find(
        commands,
        command => command[paramKey] === entityId
      )
      return !stepContainingEntry ? entity : null
    })
    .filter(entryId => entryId)
    .value()
}
