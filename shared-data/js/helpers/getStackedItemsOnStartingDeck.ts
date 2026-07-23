import {
  FLEX_STACKER_MODULE_TYPE,
  SPAN7_8_10_11_SLOT,
  TC_MODULE_LOCATION_OT2,
  TC_MODULE_LOCATION_OT3,
  THERMOCYCLER_MODULE_V1,
  THERMOCYCLER_MODULE_V2,
} from '../constants'
import { getCutoutDisplayName } from '../fixtures'
import { getModuleType } from '../modules'
import { getSlotDisplayNameFromAAWithFakes } from './deckConfiguration/getVisualSlotFrom'
import { getLabwareDefinitionsByURIForProtocol } from './getLabwareDefinitionsByURIForProtocol'
import { getLabwareDefURI } from './getLabwareDefURI'
import { getLiquidsByIdForLabware } from './getLiquidsByIdForLabware'
import { locationIsOnLabware } from './symbolicPositionHelpers'

import type { CutoutId } from '../../deck'
import type {
  FlexStackerFillRunTimeCommand,
  FlexStackerSetStoredLabwareRunTimeCommand,
  LoadLabwareRunTimeCommand,
  LoadLidParams,
  LoadLidRunTimeCommand,
  LoadLidStackRunTimeCommand,
  OnAddressableAreaLocationSequenceComponent,
  OnCutoutFixtureLocationSequenceComponent,
  RunTimeCommand,
} from '../../protocol'
import type { LoadedLabware, LoadedModule, ModuleModel } from '../types'
import type { LabwareByLiquidId } from './getLabwareInfoByLiquidId'

export interface LabwareInStack {
  definitionUri: string
  displayName: string
  labwareId: string
  lidId?: string
  lidDisplayName?: string
}
export interface ModuleInStack {
  moduleModel: ModuleModel
  moduleId: string
  moduleSlotName: string
}

export type StackItem = LabwareInStack | ModuleInStack

export interface StackedItemsOnDeck {
  [location: string]: StackItem[]
}

interface LoadLidOnLabwareParams extends Omit<LoadLidParams, 'location'> {
  location: {
    labwareId: string
  }
}
interface LoadLidOnLabwareCommad extends Omit<LoadLidRunTimeCommand, 'params'> {
  params: LoadLidOnLabwareParams
}

export interface LabwareLiquidRenderInfo extends LabwareInStack {
  quantity: number
  liquids: number
}

export function getStackerLocationFromSlotName(slotName: string): string {
  return `STACKER ${slotName.charAt(0)}`
}

/**
 * This function parses all commands that load labware in reverse order and makes a map of
 * shape [location]: ordered list of stacked items in slot at the start of a protocol, returning
 * exactly one array per utilized slot in the starting deck state
 * with an additional list for all off deck items
 * @param commands
 * @param loadedLabware
 * @param loadedModules
 * @returns [location]: StackItem[] where location is a slot name, 'offDeck', or a hopper location 'STACKER A(column)'
 */

export function getStackedItemsOnStartingDeck(
  commands: RunTimeCommand[],
  loadedLabware: LoadedLabware[],
  loadedModules: LoadedModule[]
): StackedItemsOnDeck {
  const labwareDefinitions = getLabwareDefinitionsByURIForProtocol(commands)
  const loadLidCommands = commands.filter(
    (command): command is LoadLidOnLabwareCommad =>
      command.commandType === 'loadLid' &&
      locationIsOnLabware(command.params.location)
  )
  const labwareAndLidOnDeck = commands
    .filter(
      (
        command
      ): command is LoadLabwareRunTimeCommand | LoadLidStackRunTimeCommand =>
        ['loadLabware', 'loadLidStack'].includes(command.commandType)
    )
    .toReversed()
    .reduce<StackedItemsOnDeck>((acc, command) => {
      let stackFromCommand: StackItem[] = []
      let location = ''
      if (command.params.location === 'systemLocation') return acc
      else if (
        command.params.location === 'offDeck' &&
        command.result != null
      ) {
        const offDeckArray = Object.keys(acc).includes('offDeck')
          ? acc.offDeck
          : []
        if (command.commandType === 'loadLabware') {
          const offDeckItem: LabwareInStack = {
            labwareId: command.result.labwareId,
            definitionUri: getLabwareDefURI(command.result.definition),
            displayName:
              command.params.displayName ??
              command.result.definition.metadata.displayName,
          }
          const lidCommand = loadLidCommands.find(
            lidCommand =>
              lidCommand.params.location.labwareId === command.result?.labwareId
          )
          offDeckItem.lidDisplayName =
            lidCommand?.result != null
              ? lidCommand.result.definition.metadata.displayName
              : undefined
          offDeckItem.lidId =
            lidCommand?.result != null ? lidCommand.result.labwareId : undefined
          offDeckArray.push(offDeckItem)
        } else if (
          command.commandType === 'loadLidStack' &&
          command.result?.definition != null
        ) {
          command.result.labwareIds.forEach(labwareId => {
            const offDeckItem = {
              labwareId: labwareId,
              definitionUri: getLabwareDefURI(command.result?.definition!),
              displayName:
                command.result?.definition?.metadata.displayName ?? '',
            }
            offDeckArray.push(offDeckItem)
          })
        }
        return { ...acc, offDeck: offDeckArray }
      } else if (
        command.commandType === 'loadLabware' &&
        command.result?.locationSequence != null
      ) {
        const locationSequence = command.result.locationSequence
        const cutoutId = locationSequence.find(
          (
            sequenceItem
          ): sequenceItem is OnCutoutFixtureLocationSequenceComponent =>
            sequenceItem.kind === 'onCutoutFixture'
        )?.cutoutId
        const addressableArea = locationSequence.find(
          (
            sequenceItem
          ): sequenceItem is OnAddressableAreaLocationSequenceComponent =>
            sequenceItem.kind === 'onAddressableArea'
        )?.addressableAreaName
        if (cutoutId == null && addressableArea == null) return acc
        location =
          addressableArea != null
            ? getSlotDisplayNameFromAAWithFakes(addressableArea)
            : getCutoutDisplayName(cutoutId as CutoutId)

        if (Object.keys(acc).includes(location)) return acc

        const topLabware: LabwareInStack = {
          labwareId: command.result.labwareId,
          definitionUri: getLabwareDefURI(command.result.definition),
          displayName:
            command.params.displayName ??
            command.result.definition.metadata.displayName,
        }
        const lidCommand = loadLidCommands.find(
          lidCommand =>
            lidCommand.params.location.labwareId === command.result?.labwareId
        )
        topLabware.lidDisplayName =
          lidCommand?.result != null
            ? lidCommand.result.definition.metadata.displayName
            : undefined
        topLabware.lidId =
          lidCommand?.result != null ? lidCommand.result.labwareId : undefined

        stackFromCommand = locationSequence.reduce<StackItem[]>(
          (sequenceAcc, sequenceItem) => {
            if (sequenceItem.kind === 'onLabware') {
              const labware = loadedLabware.find(
                lw => lw.id === sequenceItem.labwareId
              )
              if (labware == null) return sequenceAcc
              const labwareDef = labwareDefinitions[labware.definitionUri]
              const labwareStackItem: LabwareInStack = {
                definitionUri: labware.definitionUri,
                displayName:
                  labware.displayName ?? labwareDef.metadata.displayName,
                labwareId: sequenceItem.labwareId,
              }
              const lid =
                sequenceItem.lidId != null
                  ? loadedLabware.find(lw => lw.id === sequenceItem.lidId)
                  : null
              if (sequenceItem.lidId != null && lid != null) {
                const lidDef = labwareDefinitions[lid.definitionUri]
                labwareStackItem.lidDisplayName = lidDef.metadata.displayName
                labwareStackItem.lidId = sequenceItem.lidId
              }
              sequenceAcc.push(labwareStackItem)
              return sequenceAcc
            } else if (sequenceItem.kind === 'onModule') {
              const module = loadedModules.find(
                lm =>
                  lm.id === sequenceItem.moduleId &&
                  getModuleType(lm.model) !== FLEX_STACKER_MODULE_TYPE
              )
              if (module == null) return sequenceAcc
              const moduleSlotName =
                module.location.slotName === SPAN7_8_10_11_SLOT
                  ? '7'
                  : module.location.slotName
              const moduleStackItem: ModuleInStack = {
                moduleId: sequenceItem.moduleId,
                moduleModel: module.model,
                moduleSlotName,
              }
              if (
                module.model === THERMOCYCLER_MODULE_V2 ||
                module.model === THERMOCYCLER_MODULE_V1
              ) {
                location =
                  module.location.slotName === '7'
                    ? TC_MODULE_LOCATION_OT2
                    : TC_MODULE_LOCATION_OT3
              }
              sequenceAcc.push(moduleStackItem)
            }
            return sequenceAcc
          },
          [topLabware]
        )
      } else if (
        command.commandType === 'loadLidStack' &&
        command.result?.definition != null &&
        command.result?.stackLocationSequence != null
      ) {
        const locationSequence = command.result.stackLocationSequence
        const cutoutId = locationSequence.find(
          (
            sequenceItem
          ): sequenceItem is OnCutoutFixtureLocationSequenceComponent =>
            sequenceItem.kind === 'onCutoutFixture'
        )?.cutoutId
        const addressableArea = locationSequence.find(
          (
            sequenceItem
          ): sequenceItem is OnAddressableAreaLocationSequenceComponent =>
            sequenceItem.kind === 'onAddressableArea'
        )?.addressableAreaName
        if (cutoutId == null && addressableArea == null) return acc
        location =
          addressableArea != null
            ? getSlotDisplayNameFromAAWithFakes(addressableArea)
            : getCutoutDisplayName(cutoutId as CutoutId)
        if (cutoutId == null || Object.keys(acc).includes(location)) {
          return acc
        }
        const lidsArray: LabwareInStack[] =
          command.result.labwareIds.toReversed().map(lidId => {
            return {
              labwareId: lidId,
              definitionUri: getLabwareDefURI(command.result?.definition!),
              displayName:
                command.result?.definition?.metadata.displayName ?? '',
            }
          }) ?? []
        stackFromCommand = command.result.stackLocationSequence.reduce<
          StackItem[]
        >((sequenceAcc, sequenceItem) => {
          if (sequenceItem.kind === 'onLabware') {
            const labware = loadedLabware.find(
              lw => lw.id === sequenceItem.labwareId
            )
            if (labware == null) return sequenceAcc
            const labwareDef = labwareDefinitions[labware.definitionUri]
            const labwareStackItem: LabwareInStack = {
              definitionUri: labware.definitionUri,
              displayName:
                labware.displayName ?? labwareDef.metadata.displayName,
              labwareId: sequenceItem.labwareId,
            }
            sequenceAcc.push(labwareStackItem)
          }
          return sequenceAcc
        }, lidsArray)
      }
      return { ...acc, [location]: stackFromCommand }
    }, {})

  // add stacker labware after as we don't want the order of these commands reversed
  const allLabwareOnDeck = commands
    .filter(
      (
        command
      ): command is
        | FlexStackerSetStoredLabwareRunTimeCommand
        | FlexStackerFillRunTimeCommand =>
        ['flexStacker/setStoredLabware', 'flexStacker/fill'].includes(
          command.commandType
        )
    )
    .reduce<StackedItemsOnDeck>((acc, command) => {
      if (command.result == null) return acc
      const stackFromCommand: StackItem[] = []
      let location = ''
      const offDeckArray = Object.keys(acc).includes('offDeck')
        ? acc.offDeck
        : []
      if (command.commandType === 'flexStacker/setStoredLabware') {
        const definitionUri = getLabwareDefURI(
          command.result.primaryLabwareDefinition
        )
        const displayName =
          command.result.primaryLabwareDefinition.metadata.displayName
        const lidDisplayName =
          command.result.lidLabwareDefinition != null
            ? command.result.lidLabwareDefinition.metadata.displayName
            : undefined
        const stackerModule = loadedModules.find(
          module => module.id === command.params.moduleId
        )
        if (stackerModule == null) return acc
        const hopperLocation = getStackerLocationFromSlotName(
          stackerModule.location.slotName
        )
        // after the first setStoredLabware, future labware will be treated as offdeck
        if (Object.keys(acc).includes(hopperLocation)) {
          command.result.storedLabware?.forEach(labwareGroup => {
            offDeckArray.push({
              definitionUri,
              displayName,
              labwareId: labwareGroup.primaryLabwareId,
              lidDisplayName,
              lidId: labwareGroup.lidLabwareId ?? undefined,
            })
          })
          return { ...acc, offDeck: offDeckArray }
        } else {
          // reverse the order of this array so we add the labware in top to bottom
          const labwareInHopper: StackItem[] =
            command.result.storedLabware?.toReversed().map(labwareGroup => {
              return {
                definitionUri,
                displayName,
                labwareId: labwareGroup.primaryLabwareId,
                lidDisplayName,
                lidId: labwareGroup.lidLabwareId ?? undefined,
              }
            }) ?? []
          labwareInHopper.push({
            moduleModel: stackerModule.model,
            moduleId: command.params.moduleId,
            moduleSlotName: stackerModule.location.slotName,
          })

          return { ...acc, [hopperLocation]: labwareInHopper }
        }
      } else if (command.commandType === 'flexStacker/fill') {
        location = 'offDeck'
        const definitionUri = command.result.primaryLabwareURI
        const displayName =
          labwareDefinitions[definitionUri].metadata.displayName
        const lidDefinitionUri = command.result.lidLabwareURI
        const lidDisplayName =
          lidDefinitionUri != null
            ? labwareDefinitions[lidDefinitionUri].metadata.displayName
            : undefined
        command.result.addedLabware?.forEach(labwareGroup => {
          offDeckArray.push({
            definitionUri,
            displayName,
            labwareId: labwareGroup.primaryLabwareId,
            lidDisplayName,
            lidId: labwareGroup.lidLabwareId ?? undefined,
          })
        })
        return { ...acc, offDeck: offDeckArray }
      }
      return { ...acc, [location]: stackFromCommand }
    }, labwareAndLidOnDeck)

  const labwareAndModulesOnDeck = loadedModules.reduce<StackedItemsOnDeck>(
    (acc, module) => {
      const moduleId = module.id
      if (
        Object.values(acc).some(stack =>
          stack.find(
            (stackItem): stackItem is ModuleInStack =>
              'moduleId' in stackItem && stackItem.moduleId === moduleId
          )
        )
      ) {
        return acc
      } else {
        const slotName =
          getModuleType(module.model) === FLEX_STACKER_MODULE_TYPE
            ? getStackerLocationFromSlotName(module.location.slotName)
            : module.location.slotName
        const moduleOnDeck = {
          moduleModel: module.model,
          moduleId,
          moduleSlotName: module.location.slotName,
        }
        return { ...acc, [slotName]: [moduleOnDeck] }
      }
    },
    allLabwareOnDeck
  )
  return labwareAndModulesOnDeck
}

export function getLabwareLiquidRenderInfoFromStack(
  labwareInStack: LabwareInStack[],
  labwareByLiquidId?: LabwareByLiquidId
): LabwareLiquidRenderInfo[] {
  return labwareInStack.reduce<LabwareLiquidRenderInfo[]>((acc, stackItem) => {
    const liquidInfo =
      labwareByLiquidId != null
        ? getLiquidsByIdForLabware(stackItem.labwareId, labwareByLiquidId)
        : {}
    const liquidCount = Object.keys(liquidInfo).length
    const matchingLabwareIndex = acc.findIndex(
      lw =>
        lw.definitionUri === stackItem.definitionUri &&
        (lw.lidDisplayName == null ||
          lw.lidDisplayName === stackItem.lidDisplayName)
    )
    if (
      matchingLabwareIndex !== -1 &&
      matchingLabwareIndex === acc.length - 1
    ) {
      acc[matchingLabwareIndex].quantity += 1
      acc[matchingLabwareIndex].liquids += liquidCount
    } else {
      acc.push({
        ...stackItem,
        quantity: 1,
        liquids: liquidCount,
      })
    }
    return acc
  }, [])
}

// filter function to get stacks with no modules and on deck
export function getLabwareOnDeck(itemsOnDeck: StackedItemsOnDeck): {
  [location: string]: LabwareInStack[]
} {
  // @ts-expect-error this filter should act as a type narrower
  const labwareOnDeckEntries: Array<[string, LabwareInStack[]]> =
    Object.entries(itemsOnDeck).filter(
      ([key, value]) =>
        key !== 'offDeck' &&
        value.every(
          (stackItem): stackItem is LabwareInStack => 'labwareId' in stackItem
        )
    )
  return Object.fromEntries(labwareOnDeckEntries)
}

// filter function to get stacks that include labware
export function getStacksWithLabware(itemsOnDeck: StackedItemsOnDeck): {
  [location: string]: StackItem[]
} {
  const stacksWithLabwareEntries = Object.entries(itemsOnDeck).filter(
    ([key, value]) =>
      value.some(
        (stackItem): stackItem is LabwareInStack => 'labwareId' in stackItem
      )
  )
  return Object.fromEntries(stacksWithLabwareEntries)
}

// filter function to get off deck labware stacks
export function getOffDeckRenderInfo(
  stackedItems: StackedItemsOnDeck
): LabwareLiquidRenderInfo[] {
  const offDeckItems = Object.keys(stackedItems).includes('offDeck')
    ? stackedItems.offDeck.filter(
        (item): item is LabwareInStack => 'labwareId' in item
      )
    : null
  if (offDeckItems == null) {
    return []
  } else {
    return offDeckItems.reduce<LabwareLiquidRenderInfo[]>((acc, stackItem) => {
      const matchingLabwareIndex = acc.findIndex(
        lw =>
          lw.definitionUri === stackItem.definitionUri &&
          (lw.lidDisplayName == null ||
            lw.lidDisplayName === stackItem.lidDisplayName)
      )
      if (
        matchingLabwareIndex !== -1 &&
        matchingLabwareIndex === acc.length - 1
      ) {
        acc[matchingLabwareIndex].quantity += 1
      } else {
        acc.push({
          ...stackItem,
          quantity: 1,
          liquids: 0,
        })
      }
      return acc
    }, [])
  }
}

// filter function to get stacks that include modules
export function getStacksOnModules(itemsOnDeck: StackedItemsOnDeck): {
  [location: string]: {
    // This could be typed more cleverly as:
    // [ModuleInStack, ...StackItem[]]
    // if we're sure that the module is always the first element in the array,
    // but I'm not sure if that's actually the case.
    allItemsInStack: StackItem[]
    moduleInStack: ModuleInStack
  }
} {
  return Object.entries(itemsOnDeck).reduce((acc, entry) => {
    const [location, stack] = entry
    const moduleInStack = stack.find(
      (stackItem): stackItem is ModuleInStack => 'moduleId' in stackItem
    )
    return moduleInStack != null
      ? {
          ...acc,
          [location]: {
            allItemsInStack: stack,
            moduleInStack,
          },
        }
      : acc
  }, {})
}

export function getTopLabwareFromStack(
  itemsOnDeck: StackItem[]
): LabwareInStack | null {
  const topLabwareInStack = itemsOnDeck.find(
    (stackedItem): stackedItem is LabwareInStack => 'labwareId' in stackedItem
  )
  return topLabwareInStack ?? null
}

export function getModuleFromStack(
  itemsOnDeck: StackItem[]
): ModuleInStack | null {
  const moduleInStack = itemsOnDeck.find(
    (stackedItem): stackedItem is ModuleInStack => 'moduleId' in stackedItem
  )
  return moduleInStack ?? null
}

export const getSortedStartingDeckEntries = (
  startingDeck: StackedItemsOnDeck
): Array<{
  location: string
  stack: StackItem[]
}> => {
  const entriesOnDeck = Object.entries(startingDeck).filter(
    ([location]) => location !== 'offDeck'
  )
  const stacksWithLabware = entriesOnDeck.flatMap(([location, stacks]) => {
    const labwareStacks = stacks.filter(stack =>
      stack.some(item => 'labwareId' in item)
    )
    return labwareStacks.map(stack => ({ location, stack }))
  })
  const sortedStartingDeckEntries = stacksWithLabware.sort((a, b) =>
    a.location.localeCompare(b.location)
  )
  return sortedStartingDeckEntries
}
