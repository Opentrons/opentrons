import { getLabwareDefURI } from '@opentrons/shared-data'

import { getLabwareDisplayLocation } from '../../utils/getLabwareDisplayLocation'
import { getLoadedLabware } from '../../utils/getLoadedLabware'

import type {
  FlexStackerEmptyRunTimeCommand,
  FlexStackerFillItemsRunTimeCommand,
  FlexStackerFillRunTimeCommand,
  FlexStackerRetrieveRunTimeCommand,
  FlexStackerSetStoredLabwareItemsRunTimeCommand,
  FlexStackerSetStoredLabwareRunTimeCommand,
  FlexStackerStoreRunTimeCommand,
  LabwareDefinition,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

export type FlexStackerCommand =
  | FlexStackerSetStoredLabwareRunTimeCommand
  | FlexStackerSetStoredLabwareItemsRunTimeCommand
  | FlexStackerStoreRunTimeCommand
  | FlexStackerRetrieveRunTimeCommand
  | FlexStackerFillRunTimeCommand
  | FlexStackerEmptyRunTimeCommand
  | FlexStackerFillItemsRunTimeCommand

export const KEYS_BY_COMMAND_TYPE: {
  [commandType in FlexStackerCommand['commandType']]: string
} = {
  'flexStacker/retrieve': 'flex_stacker_retrieve',
  'flexStacker/store': 'flex_stacker_store',
  'flexStacker/setStoredLabware': 'flex_stacker_set_stored_labware',
  'flexStacker/setStoredLabwareItems': 'flex_stacker_set_stored_labware',
  'flexStacker/empty': 'flex_stacker_empty',
  'flexStacker/fill': 'flex_stacker_fill',
  'flexStacker/fillItems': 'flex_stacker_fill_items',
}

type HandledCommands = Extract<
  RunTimeCommand,
  { commandType: keyof typeof KEYS_BY_COMMAND_TYPE }
>

type GetFlexStackerCommandText = HandlesCommands<HandledCommands>

const getLabwareDisplayName = (labwareUri: string, allRunDefs: any): string => {
  const currentLabwareDef = allRunDefs.find(
    (def: LabwareDefinition) => getLabwareDefURI(def) === labwareUri
  )
  return currentLabwareDef?.metadata.displayName ?? null
}

export const getFlexStackerCommandText = ({
  command,
  allRunDefs,
  commandTextData,
  t,
  robotType,
}: // stackerCommand,
GetFlexStackerCommandText): string => {
  const primaryDefinitionDisplayName =
    command.result !== undefined && 'primaryLabwareURI' in command?.result
      ? getLabwareDisplayName(
          command?.result.primaryLabwareURI,
          allRunDefs ?? []
        )
      : null
  if (command.commandType === 'flexStacker/retrieve') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: command.result?.primaryLocationSequence,
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (primaryDefinitionDisplayName != null && slotName != null) {
      return t('branded:retrieve_labware_from_stacker_to', {
        primaryDefinitionDisplayName,
        slotName,
      })
    }
  } else if (command.commandType === 'flexStacker/store') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: command.result?.primaryOriginLocationSequence ?? null,
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (primaryDefinitionDisplayName != null && slotName != null) {
      return t('branded:store_labware_from_slot_to_stacker', {
        primaryDefinitionDisplayName,
        slotName,
      })
    }
  } else if (command.commandType === 'flexStacker/setStoredLabware') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: { moduleId: command.params?.moduleId },
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (
      command.result !== undefined &&
      'primaryLabwareDefinition' in command.result &&
      slotName != null
    ) {
      return (
        t(
          'branded:flex_stacker_set_stored_labware_with_quantity_and_location',
          {
            quantity: command.params.initialCount,
            stackerColumn: slotName,
            labwareAndLidDisplayNames:
              command.result?.primaryLabwareDefinition.metadata.displayName,
          }
        ) +
        (command.result?.lidLabwareDefinition != null
          ? t('with_lid_name', {
              lidDisplayName:
                command.result?.lidLabwareDefinition.metadata.displayName,
            })
          : '')
      )
    }
  } else if (command.commandType === 'flexStacker/setStoredLabwareItems') {
    const loadedLabwares = commandTextData?.labware ?? []
    const slotName = getLabwareDisplayLocation({
      loadedLabwares,
      location: { moduleId: command.params.moduleId },
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    const getDefinitionUri = (labwareId: string): string | undefined =>
      getLoadedLabware(loadedLabwares, labwareId)?.definitionUri
    const configLabwareIds = command.params.labware ?? []
    const primaryLabwareUri = configLabwareIds
      .map(getDefinitionUri)
      .find((uri): uri is string => uri != null)
    const primaryDisplayName =
      command.result?.primaryLabwareDefinition?.metadata.displayName ??
      (primaryLabwareUri != null
        ? getLabwareDisplayName(primaryLabwareUri, allRunDefs ?? [])
        : null)
    const quantity =
      command.result?.count ??
      command.result?.storedLabware?.length ??
      configLabwareIds.filter(
        labwareId => getDefinitionUri(labwareId) === primaryLabwareUri
      ).length

    if (primaryDisplayName != null && slotName != null && quantity > 0) {
      return (
        t(
          'branded:flex_stacker_set_stored_labware_with_quantity_and_location',
          {
            quantity,
            stackerColumn: slotName,
            labwareAndLidDisplayNames: primaryDisplayName,
          }
        ) +
        (command.result?.lidLabwareDefinition != null
          ? t('with_lid_name', {
              lidDisplayName:
                command.result.lidLabwareDefinition.metadata.displayName,
            })
          : '')
      )
    }
  } else if (command.commandType === 'flexStacker/fill') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: { moduleId: command.params?.moduleId },
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (primaryDefinitionDisplayName != null) {
      return (
        t('branded:flex_stacker_fill_with_quantity_and_labware', {
          quantity: command.params.count,
          stackerColumn: slotName,
          labwareAndLidDisplayNames: primaryDefinitionDisplayName,
        }) +
        (command.result?.lidLabwareURI != null
          ? t('with_lid_name', {
              lidDisplayName: getLabwareDisplayName(
                command.result?.lidLabwareURI,
                allRunDefs ?? []
              ),
            })
          : '')
      )
    }
  } else if (command.commandType === 'flexStacker/empty') {
    const slotName = getLabwareDisplayLocation({
      loadedLabwares: commandTextData?.labware ?? [],
      location: { moduleId: command.params?.moduleId },
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    if (primaryDefinitionDisplayName != null && slotName != null) {
      return t('branded:flex_stacker_empty_from_location', {
        stackerColumn: slotName,
      })
    }
  } else if (command.commandType === 'flexStacker/fillItems') {
    const loadedLabwares = commandTextData?.labware ?? []
    const slotName = getLabwareDisplayLocation({
      loadedLabwares,
      location: { moduleId: command.params.moduleId },
      robotType,
      allRunDefs,
      loadedModules: commandTextData?.modules ?? [],
      t,
    })
    const getDefinitionUri = (labwareId: string): string | undefined =>
      getLoadedLabware(loadedLabwares, labwareId)?.definitionUri
    const fillLabwareIds = command.params.labware ?? []
    const primaryLabwareUri =
      command.result?.primaryLabwareURI ??
      fillLabwareIds
        .map(getDefinitionUri)
        .find((uri): uri is string => uri != null)
    const labwareDisplayName =
      primaryDefinitionDisplayName ??
      (primaryLabwareUri != null
        ? getLabwareDisplayName(primaryLabwareUri, allRunDefs ?? [])
        : null)
    const quantity =
      command.result?.addedLabware?.length ??
      command.result?.count ??
      fillLabwareIds.filter(
        labwareId => getDefinitionUri(labwareId) === primaryLabwareUri
      ).length

    if (labwareDisplayName != null && slotName != null && quantity > 0) {
      return (
        t('branded:flex_stacker_fill_with_quantity_and_labware', {
          quantity,
          stackerColumn: slotName,
          labwareAndLidDisplayNames: labwareDisplayName,
        }) +
        (command.result?.lidLabwareURI != null
          ? t('with_lid_name', {
              lidDisplayName: getLabwareDisplayName(
                command.result.lidLabwareURI,
                allRunDefs ?? []
              ),
            })
          : '')
      )
    }
  }
  return t('branded:' + KEYS_BY_COMMAND_TYPE[command.commandType])
}
