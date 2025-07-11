import { getLabwareDefURI, getModuleDef } from '@opentrons/shared-data'

import type {
  ComputeLabwareOriginInput,
  DeckDefinition,
  LabwareDefinition,
  LabwareLocation,
  LoadedLabware,
  LoadedModule,
  ModuleDefinition,
} from '@opentrons/shared-data'

/**
 * Converts a labware location to something that computeLabwareOrigin() can take as
 * input and compute absolute deck coordinates from.
 *
 * This basically just does a lot of tedious lookups to resolve IDs into full definitions.
 *
 * Returns "error" if there was a problem doing the conversion, probably because of
 * some invalid input to this function, like entries missing from `loadedLabware`.
 * Returns "offDeck" if the labware is known to be off-deck, so it doesn't have
 * coordinates.
 */
export function resolveLabwareLocation({
  deckDef,
  movedLabwareDef,
  location,
  loadedModules,
  loadedLabware,
  labwareDefinitions,
}: {
  deckDef: DeckDefinition
  movedLabwareDef: LabwareDefinition
  location: LabwareLocation
  loadedModules: LoadedModule[]
  loadedLabware: LoadedLabware[]
  labwareDefinitions: LabwareDefinition[]
}): 'error' | 'offDeck' | ComputeLabwareOriginInput {
  const labwareTopToBottom = resolveLabwareStack({
    topLabwareDef: movedLabwareDef,
    topLabwareLocation: location,
    loadedLabware,
    labwareDefinitions,
  })
  const labwareBottomToTop =
    labwareTopToBottom != null ? labwareTopToBottom.toReversed() : null

  if (labwareBottomToTop == null || labwareBottomToTop.length < 1) {
    return 'error'
  }

  const bottomLabwareLocation = labwareBottomToTop[0].location

  if (
    bottomLabwareLocation === 'offDeck' ||
    bottomLabwareLocation === 'systemLocation'
  ) {
    return 'offDeck'
  }

  const bottom = (():
    | 'error'
    | {
        slotId: string
        moduleDefinition: ModuleDefinition | null
      } => {
    if ('moduleId' in bottomLabwareLocation) {
      const loadedModule = loadedModules.find(
        m => m.id === bottomLabwareLocation.moduleId
      )
      if (loadedModule == null) return 'error'
      const moduleDefinition = getModuleDef(loadedModule.model)
      const modSlot = deckDef.locations.addressableAreas.find(
        s => s.id === loadedModule.location.slotName
      )
      if (modSlot == null) return 'error'
      return { slotId: modSlot.id, moduleDefinition }
    } else if ('slotName' in bottomLabwareLocation) {
      return { slotId: bottomLabwareLocation.slotName, moduleDefinition: null }
    } else if ('addressableAreaName' in bottomLabwareLocation) {
      return {
        slotId: bottomLabwareLocation.addressableAreaName,
        moduleDefinition: null,
      }
    } else {
      // Should not be reachable if resolveLabwareStack() did its job.
      return 'error'
    }
  })()

  if (bottom === 'error') {
    return 'error'
  }

  return {
    deckDefinition: deckDef,
    slotId: bottom.slotId,
    moduleDefinition: bottom.moduleDefinition,
    labwareDefinitionsBottomToTop: labwareBottomToTop.map(l => l.definition),
  }
}

/**
 * Return the labware comprising the labware part of a stack. In other words, everything
 * from the top labware down to, and excluding, the underlying module or deck slot.
 */
function resolveLabwareStack({
  topLabwareDef,
  topLabwareLocation,
  loadedLabware,
  labwareDefinitions,
}: {
  topLabwareDef: LabwareDefinition
  topLabwareLocation: LabwareLocation
  loadedLabware: LoadedLabware[]
  labwareDefinitions: LabwareDefinition[]
}): Array<{
  definition: LabwareDefinition
  location: LabwareLocation
}> | null {
  let bottomMostLabwareSoFar = {
    definition: topLabwareDef,
    location: topLabwareLocation,
  }
  const labwareTopToBottomSoFar = [bottomMostLabwareSoFar]

  while (
    typeof bottomMostLabwareSoFar.location === 'object' &&
    'labwareId' in bottomMostLabwareSoFar.location
  ) {
    const newBottomLabwareId = bottomMostLabwareSoFar.location.labwareId
    const newBottomLabware = loadedLabware.find(
      l => l.id === newBottomLabwareId
    )
    const newBottomLabwareDefinition = labwareDefinitions.find(
      def => getLabwareDefURI(def) === newBottomLabware?.definitionUri
    )
    if (newBottomLabware == null || newBottomLabwareDefinition == null) {
      console.warn(
        `Expected to find details for labware ID ${newBottomLabwareId} but could not.`
      )
      return null
    }
    bottomMostLabwareSoFar = {
      definition: newBottomLabwareDefinition,
      location: newBottomLabware.location,
    }
    labwareTopToBottomSoFar.push(bottomMostLabwareSoFar)
  }

  return labwareTopToBottomSoFar
}
