// @flow

import find from 'lodash/find'
import map from 'lodash/map'
import type {
  InitialDeckSetup,
  SavedStepFormState,
  ModuleOnDeck,
  PipetteOnDeck,
} from '../../../step-forms'

// TODO JF 2020-2-21 combine fns and make it more generic for flow type issues
export function getUnusedModules(
  entities: $PropertyType<InitialDeckSetup, 'modules'>,
  commands: SavedStepFormState
): Array<ModuleOnDeck> {
  return map(entities, (entity, entityId) => {
    const stepContainingEntry = find(
      commands,
      command => command['moduleId'] === entityId
    )
    return !stepContainingEntry ? entity : null
  }).filter(Boolean)
}

export function getUnusedPipettes(
  entities: $PropertyType<InitialDeckSetup, 'pipettes'>,
  commands: SavedStepFormState
): Array<PipetteOnDeck> {
  return map(entities, (entity, entityId) => {
    const stepContainingEntry = find(
      commands,
      command => command['pipette'] === entityId
    )
    return !stepContainingEntry ? entity : null
  }).filter(Boolean)
}
