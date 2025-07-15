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
 * some invalid input to this function, like entries missing from `otherLoadedLabware`.
 * Returns "offDeck" if the labware is known to be off-deck, so it doesn't have
 * coordinates.
 */
export function resolveLabwareLocation({
  deckDef,
  targetLabwareDef,
  targetLabwareLocation,
  loadedModules,
  otherLoadedLabware,
  otherLabwareDefinitions,
}: {
  deckDef: DeckDefinition
  targetLabwareDef: LabwareDefinition
  targetLabwareLocation: LabwareLocation
  loadedModules: LoadedModule[]
  otherLoadedLabware: LoadedLabware[]
  otherLabwareDefinitions: LabwareDefinition[]
}): 'error' | 'offDeck' | ComputeLabwareOriginInput {
  const labwareTopToBottom = resolveLabwareStack({
    topLabwareDef: targetLabwareDef,
    topLabwareLocation: targetLabwareLocation,
    otherLoadedLabware,
    otherLabwareDefinitions,
  })
  const labwareBottomToTop =
    labwareTopToBottom !== 'error' ? labwareTopToBottom.toReversed() : 'error'

  if (labwareBottomToTop === 'error' || labwareBottomToTop.length < 1) {
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
  otherLoadedLabware,
  otherLabwareDefinitions,
}: {
  topLabwareDef: LabwareDefinition
  topLabwareLocation: LabwareLocation
  otherLoadedLabware: LoadedLabware[]
  otherLabwareDefinitions: LabwareDefinition[]
}):
  | 'error'
  | Array<{
      definition: LabwareDefinition
      location: LabwareLocation
    }> {
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
    const newBottomLabware = otherLoadedLabware.find(
      l => l.id === newBottomLabwareId
    )
    const newBottomLabwareDefinition = otherLabwareDefinitions.find(
      def => getLabwareDefURI(def) === newBottomLabware?.definitionUri
    )
    if (newBottomLabware == null || newBottomLabwareDefinition == null) {
      console.warn(
        `Expected to find details for labware ID ${newBottomLabwareId} but could not.`
      )
      return 'error'
    }
    bottomMostLabwareSoFar = {
      definition: newBottomLabwareDefinition,
      location: newBottomLabware.location,
    }
    labwareTopToBottomSoFar.push(bottomMostLabwareSoFar)
  }

  return labwareTopToBottomSoFar
}
