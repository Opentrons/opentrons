import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import without from 'lodash/without'

import {
  getLabwareDisplayLocation,
  getLoadedLabware,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getAllLabwareDefs,
  getLabwareDisplayName,
  getLoadedLabwareDefinitionsByUri,
} from '@opentrons/shared-data'

import { ERROR_KINDS, STACKER_ERROR_KINDS } from '../constants'
import { getErrorKind } from '../utils'

import type { CommandsData, PipetteData, Run } from '@opentrons/api-client'
import type {
  DisplayLocationSlotOnlyParams,
  WellGroup,
} from '@opentrons/components'
import type {
  AspirateRunTimeCommand,
  DispenseRunTimeCommand,
  Failed,
  FlexStackerRetrieveRunTimeCommand,
  FlexStackerStoreRunTimeCommand,
  LabwareDefinition,
  LabwareLocation,
  LiquidProbeRunTimeCommand,
  LoadedLabware,
  LoadedModule,
  MoveLabwareRunTimeCommand,
  PickUpTipRunTimeCommand,
  RunCommandError,
  RunCommandFlexStackerError,
} from '@opentrons/shared-data'
import type { ErrorRecoveryFlowsProps } from '..'
import type { ErrorKind } from '../types'
import type { FailedCommandBySource } from './useRetainedFailedCommandBySource'

interface UseFailedLabwareUtilsProps {
  failedCommand: FailedCommandBySource | null
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
  failedPipetteInfo: PipetteData | null
  runCommands?: CommandsData
  runRecord?: Run
}

interface RelevantFailedLabwareLocations {
  displayNameCurrentLoc: string
  displayNameNewLoc: string | null
  currentLoc: LabwareLocation | null
  newLoc: LabwareLocation | null
}

interface LabwareNames {
  /* The name of the labware relevant to the failed command, if any.  */
  name: string | undefined
  /* The user-content nickname of the failed labware, if any */
  nickName: string | undefined
}

export type UseFailedLabwareUtilsResult = UseTipSelectionUtilsResult & {
  /* Info for the labware relevant to the failed command, if any. */
  failedLabware: LoadedLabware | null
  /* Details relating to the labware location. */
  failedLabwareLocations: RelevantFailedLabwareLocations
  /* Names of the labware relevant to the failed command, if any. */
  failedLabwareNames: LabwareNames
  /* Info for labware from which the last tip was picked up before failure, if any. */
  relevantPickUpTipLabware: LoadedLabware | null
  /* Details relating to the labware location from which the last tip was picked up before failure, if any. */
  relevantPickUpTipLwLocs: RelevantFailedLabwareLocations
  /* The name of the well(s) from which the last tip was picked up before failure, if any. */
  relevantPickUpTipWellName: string | null
  /* Names of the labware from which the last tip was picked up before failure, if any. */
  relevantPickUpTipLwNames: LabwareNames
  /* Details relating to the labware quantity in the stacker. */
  labwareQuantity: number | null
}

/** Utils for labware relating to the failedCommand.
 *
 * NOTE: What constitutes "relevant labware" varies depending on the errorKind.
 * For overpressure errors, the relevant labware is the tip rack from which the pipette picked up the tip.
 * For no liquid detected errors, the relevant labware is the well in which no liquid was detected.
 *
 * Depending on the error kind, the information provided by the failed command may overlap with the information
 * provided by the relevant pickup tip command.
 * For stacker errors the labware is the labware set by flexStacker/setStoredLabwre.
 */
export function useFailedLabwareUtils({
  failedCommand,
  protocolAnalysis,
  failedPipetteInfo,
  runCommands,
  runRecord,
}: UseFailedLabwareUtilsProps): UseFailedLabwareUtilsResult {
  const failedCommandByRunRecord = failedCommand?.byRunRecord ?? null
  const errorKind = getErrorKind(failedCommand)

  const recentRelevantFailedLabwareCmd = useMemo(
    () =>
      getRelevantFailedLabwareCmdFrom({
        failedCommand,
        runCommands,
      }),
    [failedCommand, runCommands]
  )
  const relevantPickUpTipCommand = getRelevantPickUpTipCommand(
    failedCommandByRunRecord,
    runCommands
  )
  const tipSelectionUtils = useTipSelectionUtils(relevantPickUpTipCommand)

  const failedLabwareDetails = useMemo(
    () =>
      getLabwareDisplayNamesFromFailedCmd(
        protocolAnalysis,
        recentRelevantFailedLabwareCmd,
        runRecord
      ),
    [protocolAnalysis, recentRelevantFailedLabwareCmd, runRecord]
  )
  const relevantPickUpTipCmdDetails = useMemo(
    () =>
      getLabwareDisplayNamesFromFailedCmd(
        protocolAnalysis,
        relevantPickUpTipCommand,
        runRecord
      ),
    [protocolAnalysis, relevantPickUpTipCommand, runRecord]
  )

  const failedLabware = useMemo(
    () => getLabwareInfoFrom(recentRelevantFailedLabwareCmd, runRecord),
    [recentRelevantFailedLabwareCmd, runRecord]
  )
  const relevantPickUpTipLabware = useMemo(
    () => getLabwareInfoFrom(relevantPickUpTipCommand, runRecord),
    [relevantPickUpTipCommand, runRecord]
  )
  const relevantPickUpTipLwLocs = useRelevantFailedLwLocations({
    failedLabware: relevantPickUpTipLabware,
    failedCommandByRunRecord,
    runRecord,
    errorKind,
  })

  const relevantPickUpTipWellName = getRelevantWellName(
    failedPipetteInfo,
    relevantPickUpTipCommand
  )

  const failedLabwareLocations = useRelevantFailedLwLocations({
    failedLabware,
    failedCommandByRunRecord,
    runRecord,
    errorKind,
  })

  const labwareQuantity = getFailedLabwareQuantity(
    runCommands,
    recentRelevantFailedLabwareCmd,
    errorKind
  )

  return {
    ...tipSelectionUtils,
    failedLabwareNames: {
      name: failedLabwareDetails?.name ?? undefined,
      nickName: failedLabwareDetails?.nickname ?? undefined,
    },
    failedLabware,
    failedLabwareLocations,
    relevantPickUpTipWellName,
    relevantPickUpTipLabware,
    relevantPickUpTipLwLocs,
    relevantPickUpTipLwNames: {
      name: relevantPickUpTipCmdDetails?.name ?? undefined,
      nickName: relevantPickUpTipCmdDetails?.nickname ?? undefined,
    },
    labwareQuantity,
  }
}

type FailedCommandRelevantLabware =
  | Failed<AspirateRunTimeCommand>
  | Failed<DispenseRunTimeCommand>
  | Failed<LiquidProbeRunTimeCommand>
  | Failed<PickUpTipRunTimeCommand>
  | Failed<MoveLabwareRunTimeCommand>
  | Failed<FlexStackerRetrieveRunTimeCommand>
  | null

interface RelevantFailedLabwareCmd {
  failedCommand: FailedCommandBySource | null
  runCommands?: CommandsData
}

// Return the actual command that contains the info relating to the relevant labware.
export function getRelevantFailedLabwareCmdFrom({
  failedCommand,
  runCommands,
}: RelevantFailedLabwareCmd): FailedCommandRelevantLabware {
  const failedCommandByRunRecord = failedCommand?.byRunRecord ?? null
  const errorKind = getErrorKind(failedCommand)

  switch (errorKind) {
    case ERROR_KINDS.NO_LIQUID_DETECTED:
      return failedCommandByRunRecord as LiquidProbeRunTimeCommand
    case ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE:
    case ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING:
    case ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING:
    case ERROR_KINDS.STALL_OR_COLLISION:
      return getRelevantPickUpTipCommand(failedCommandByRunRecord, runCommands)
    case ERROR_KINDS.GRIPPER_ERROR:
      return failedCommandByRunRecord as MoveLabwareRunTimeCommand
    case ERROR_KINDS.STALL_WHILE_STACKING:
    case ERROR_KINDS.SHUTTLE_MISSING:
    case ERROR_KINDS.LABWARE_MISSING_IN_HOPPER:
    case ERROR_KINDS.LABWARE_MISSING_IN_SHUTTLE:
      return failedCommandByRunRecord as FlexStackerRetrieveRunTimeCommand
    default:
      console.error(
        `useFailedLabwareUtils: No labware associated with error kind ${errorKind}. Handle case explicitly.`
      )
      return null
  }
}

// Returns the most recent pickUpTip command for the pipette used in the failed command, if any.
function getRelevantPickUpTipCommand(
  failedCommandByRunRecord: FailedCommandBySource['byRunRecord'] | null,
  runCommands?: CommandsData
): Failed<PickUpTipRunTimeCommand> | null {
  if (
    failedCommandByRunRecord == null ||
    runCommands == null ||
    !('pipetteId' in failedCommandByRunRecord.params)
  ) {
    return null
  }

  const failedCmdPipetteId = failedCommandByRunRecord.params.pipetteId

  // Reverse iteration is faster as long as # recovery commands < # run commands.
  const failedCommandIdx = runCommands.data.findLastIndex(
    command => command.key === failedCommandByRunRecord.key
  )

  const recentPickUpTipCmd = runCommands.data
    .slice(0, failedCommandIdx)
    .findLast(
      command =>
        command.commandType === 'pickUpTip' &&
        command.params.pipetteId === failedCmdPipetteId
    )

  if (recentPickUpTipCmd == null) {
    return null
  } else {
    return recentPickUpTipCmd as Failed<PickUpTipRunTimeCommand>
  }
}

interface UseTipSelectionUtilsResult {
  /* Always returns null if the relevant labware is not relevant to tip pick up. */
  selectedTipLocations: WellGroup | null
  tipSelectorDef: LabwareDefinition
  selectTips: (tipGroup: WellGroup) => void
  deselectTips: (locations: string[]) => void
  areTipsSelected: boolean
}

// Utils for initializing and interacting with the Tip Selector component.
function useTipSelectionUtils(
  relevantPickUpTipCmd: FailedCommandRelevantLabware
): UseTipSelectionUtilsResult {
  const [selectedLocs, setSelectedLocs] = useState<WellGroup | null>(null)

  // Note that while other commands may have a wellName associated with them,
  // we are only interested in wells for the purposes of tip picking up.
  // Support state updates if the underlying well data changes, since this data is lazily retrieved and may change shortly
  // after Error Recovery launches.
  const initialWellName =
    relevantPickUpTipCmd != null &&
    relevantPickUpTipCmd.commandType === 'pickUpTip'
      ? relevantPickUpTipCmd.params.wellName
      : null
  useEffect(() => {
    if (
      relevantPickUpTipCmd != null &&
      relevantPickUpTipCmd.commandType === 'pickUpTip'
    ) {
      setSelectedLocs({
        [relevantPickUpTipCmd.params.wellName]: null,
      })
    }
  }, [initialWellName])

  const deselectTips = (locations: string[]): void => {
    setSelectedLocs(prevLocs =>
      without(Object.keys(prevLocs as WellGroup), ...locations).reduce(
        (acc, well) => {
          return { ...acc, [well]: null }
        },
        {}
      )
    )
  }

  const selectTips = (tipGroup: WellGroup): void => {
    setSelectedLocs(() => ({ ...tipGroup }))
  }

  // Use this labware to represent all tip racks for manual tip selection.
  const tipSelectorDef = useMemo(
    () =>
      getAllLabwareDefs()[
        'opentrons/thermoscientificnunc_96_wellplate_1300ul/1'
      ],
    []
  )

  const areTipsSelected =
    selectedLocs != null && Object.keys(selectedLocs).length > 0

  return {
    selectedTipLocations: selectedLocs,
    tipSelectorDef,
    selectTips,
    deselectTips,
    areTipsSelected,
  }
}

export function getFailedLabwareQuantity(
  runCommands: CommandsData | undefined,
  recentRelevantFailedLabwareCmd: FailedCommandRelevantLabware,
  errorKind: ErrorKind
): number | null {
  if (STACKER_ERROR_KINDS.includes(errorKind) && runCommands != null) {
    const failedCommandIndex = runCommands?.data.findIndex(
      x => x.id === recentRelevantFailedLabwareCmd?.id
    )

    const commandsBeforefailedCmd = runCommands?.data.slice(
      0,
      failedCommandIndex ?? 0
    )

    const storeOrRetrieveLabwareLast = commandsBeforefailedCmd?.findLast(
      (
        cmd
      ): cmd is
        | FlexStackerRetrieveRunTimeCommand
        | FlexStackerStoreRunTimeCommand =>
        cmd.commandType === 'flexStacker/retrieve' ||
        cmd.commandType === 'flexStacker/store'
    )
    if (
      storeOrRetrieveLabwareLast != null &&
      'result' in storeOrRetrieveLabwareLast
    ) {
      return storeOrRetrieveLabwareLast.commandType === 'flexStacker/retrieve'
        ? storeOrRetrieveLabwareLast?.result?.primaryLocationSequence.length ??
            0
        : storeOrRetrieveLabwareLast?.result
            ?.eventualDestinationLocationSequence?.length ?? 0
    }
    // in case there is no result calculate based on setStoredLabware count
    else {
      const setStoredLabwareLast = commandsBeforefailedCmd?.findLast(
        cmd => cmd.commandType === 'flexStacker/setStoredLabware'
      )
      const setStoredLabwareLastIndex = commandsBeforefailedCmd?.findLastIndex(
        cmd => cmd.commandType === 'flexStacker/setStoredLabware'
      )
      const itemsToCheck = commandsBeforefailedCmd?.slice(
        setStoredLabwareLastIndex ?? 0,
        failedCommandIndex ?? 0
      )

      if (
        setStoredLabwareLast != null &&
        'initialCount' in setStoredLabwareLast.params
      ) {
        const total = setStoredLabwareLast?.params.initialCount ?? 0
        const retreiveCmds =
          itemsToCheck?.filter(
            cmd => cmd.commandType === 'flexStacker/retrieve'
          ).length ?? 0
        const storeCmds =
          itemsToCheck?.filter(cmd => cmd.commandType === 'flexStacker/store')
            .length ?? 0
        return total - retreiveCmds + storeCmds
      } else {
        return 0
      }
    }
  }
  return null
}

export function getRelevantLabwareIdFromFailedCmd(
  recentRelevantFailedLabwareCmd: FailedCommandRelevantLabware
): string | null {
  const isStackerError = (
    error?: RunCommandError | null
  ): error is RunCommandFlexStackerError =>
    error != null &&
    error.isDefined &&
    [
      'flexStackerStallOrCollision',
      'flexStackerShuttleMissing',
      'flexStackerHopperLabwareFailed',
    ].includes(error.errorType)
  if (recentRelevantFailedLabwareCmd == null) {
    return null
  } else if (isStackerError(recentRelevantFailedLabwareCmd?.error)) {
    return recentRelevantFailedLabwareCmd?.error?.errorInfo?.labwareId ?? null
  } else if (
    recentRelevantFailedLabwareCmd.commandType !== 'flexStacker/retrieve'
  ) {
    return recentRelevantFailedLabwareCmd.params.labwareId
  } else {
    return null
  }
}

// Get the name of the relevant labware relevant to the failed command, if any.
export function getLabwareDisplayNamesFromFailedCmd(
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis'],
  recentRelevantFailedLabwareCmd: FailedCommandRelevantLabware,
  runRecord?: Run
): { name: string | null; nickname: string | null } | null {
  const labwareId = getRelevantLabwareIdFromFailedCmd(
    recentRelevantFailedLabwareCmd
  )
  if (labwareId == null) {
    return null
  }
  const lwDefsByURI = getLoadedLabwareDefinitionsByUri(
    protocolAnalysis?.commands ?? []
  )

  const labwareNickname =
    protocolAnalysis != null
      ? getLoadedLabware(protocolAnalysis.labware, labwareId)?.displayName ??
        null
      : null
  const failedLWURI = runRecord?.data.labware.find(
    labware => labware.id === labwareId
  )?.definitionUri
  if (failedLWURI != null && Object.keys(lwDefsByURI).includes(failedLWURI)) {
    return {
      name: getLabwareDisplayName(lwDefsByURI[failedLWURI]),
      nickname: labwareNickname,
    }
  } else {
    return null
  }
}

// Get the relevant labware related to the failed command, if any.
function getLabwareInfoFrom(
  recentRelevantPickUpTipCmd: FailedCommandRelevantLabware,
  runRecord?: Run
): LoadedLabware | null {
  return (
    runRecord?.data.labware.find(
      lw =>
        lw.id === getRelevantLabwareIdFromFailedCmd(recentRelevantPickUpTipCmd)
    ) ?? null
  )
}

// Return the name of the well(s) related to the failed command, if any.
export function getRelevantWellName(
  failedPipetteInfo: UseFailedLabwareUtilsProps['failedPipetteInfo'],
  recentRelevantPickUpTipCmd: FailedCommandRelevantLabware
): string {
  if (
    failedPipetteInfo == null ||
    recentRelevantPickUpTipCmd == null ||
    !('wellName' in recentRelevantPickUpTipCmd.params)
  ) {
    return ''
  }

  const channels = failedPipetteInfo.data.channels
  const wellName = recentRelevantPickUpTipCmd.params.wellName
  const wellNameNumber = wellName.slice(1)

  if (channels === 8) {
    return `A${wellNameNumber} - H${wellNameNumber}`
  }
  // Well names are not used for the 96-channel currently.
  else {
    return wellName
  }
}

export type GetRelevantLwLocationsParams = Pick<
  UseFailedLabwareUtilsProps,
  'runRecord'
> & {
  failedLabware: UseFailedLabwareUtilsResult['failedLabware']
  failedCommandByRunRecord: FailedCommandBySource['byRunRecord'] | null
  errorKind: ErrorKind
}

export function useRelevantFailedLwLocations({
  failedLabware,
  failedCommandByRunRecord,
  runRecord,
  errorKind,
}: GetRelevantLwLocationsParams): RelevantFailedLabwareLocations {
  const { t } = useTranslation('protocol_command_text')

  const loadedModules = runRecord?.data?.modules ?? []
  const BASE_DISPLAY_PARAMS: Omit<DisplayLocationSlotOnlyParams, 'location'> = {
    loadedLabwares: runRecord?.data?.labware ?? [],
    loadedModules,
    robotType: FLEX_ROBOT_TYPE,
    t,
    detailLevel: 'slot-only',
    isOnDevice: false, // Always return the "slot XYZ" copy, which is the desktop copy.
  }

  let location
  if (STACKER_ERROR_KINDS.includes(errorKind)) {
    if (
      failedCommandByRunRecord?.params != null &&
      'moduleId' in failedCommandByRunRecord?.params
    ) {
      location = {
        moduleId: failedCommandByRunRecord?.params.moduleId,
      }
    } else {
      location = null
    }
  } else {
    location = failedLabware?.location ?? null
  }

  const displayNameCurrentLoc = getLabwareDisplayLocation({
    ...BASE_DISPLAY_PARAMS,
    location: location,
  })

  const getNewLocation = (): Pick<
    RelevantFailedLabwareLocations,
    'displayNameNewLoc' | 'newLoc'
  > => {
    switch (failedCommandByRunRecord?.commandType) {
      case 'moveLabware':
        return {
          displayNameNewLoc: getLabwareDisplayLocation({
            ...BASE_DISPLAY_PARAMS,
            location: failedCommandByRunRecord.params.newLocation,
          }),
          newLoc: failedCommandByRunRecord.params.newLocation,
        }
      case 'flexStacker/retrieve':
      case 'flexStacker/store':
        return {
          displayNameNewLoc: getLabwareDisplayLocation({
            ...BASE_DISPLAY_PARAMS,
            location:
              loadedModules.find(
                (m: LoadedModule) =>
                  m.id === failedCommandByRunRecord?.params.moduleId
              )?.location ?? 'offDeck',
          }),
          newLoc: {
            moduleId: failedCommandByRunRecord?.params.moduleId,
          },
        }
      default:
        return {
          displayNameNewLoc: null,
          newLoc: null,
        }
    }
  }

  return {
    displayNameCurrentLoc,
    currentLoc: failedLabware?.location ?? null,
    ...getNewLocation(),
  }
}
