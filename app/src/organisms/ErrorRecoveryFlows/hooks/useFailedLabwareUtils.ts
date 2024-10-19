import { useMemo, useState } from 'react'
import without from 'lodash/without'
import { useTranslation } from 'react-i18next'

import {
  FLEX_ROBOT_TYPE,
  getAllLabwareDefs,
  getLabwareDisplayName,
  getLoadedLabwareDefinitionsByUri,
} from '@opentrons/shared-data'

import { ERROR_KINDS } from '../constants'
import { getErrorKind } from '../utils'
import {
  getLoadedLabware,
  getLabwareDisplayLocation,
} from '/app/local-resources/labware'

import type { WellGroup } from '@opentrons/components'
import type { CommandsData, PipetteData, Run } from '@opentrons/api-client'
import type {
  LabwareDefinition2,
  LoadedLabware,
  PickUpTipRunTimeCommand,
  AspirateRunTimeCommand,
  DispenseRunTimeCommand,
  LiquidProbeRunTimeCommand,
  MoveLabwareRunTimeCommand,
  LabwareLocation,
} from '@opentrons/shared-data'
import type { ErrorRecoveryFlowsProps } from '..'
import type { ERUtilsProps } from './useERUtils'

interface UseFailedLabwareUtilsProps {
  failedCommandByRunRecord: ERUtilsProps['failedCommandByRunRecord']
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
  failedPipetteInfo: PipetteData | null
  allRunDefs: LabwareDefinition2[]
  runCommands?: CommandsData
  runRecord?: Run
}

interface RelevantFailedLabwareLocations {
  currentLoc: string
  newLoc: string | null
}

export type UseFailedLabwareUtilsResult = UseTipSelectionUtilsResult & {
  /* The name of the labware relevant to the failed command, if any.  */
  failedLabwareName: string | null
  /* Info for the labware relevant to the failed command, if any. */
  failedLabware: LoadedLabware | null
  /* The name of the well(s) or tip location(s), if any. */
  relevantWellName: string | null
  /* The user-content nickname of the failed labware, if any */
  failedLabwareNickname: string | null
  failedLabwareLocations: RelevantFailedLabwareLocations
}

/** Utils for labware relating to the failedCommand.
 *
 * NOTE: What constitutes "relevant labware" varies depending on the errorKind.
 * For overpressure errors, the relevant labware is the tip rack from which the pipette picked up the tip.
 * For no liquid detected errors, the relevant labware is the well in which no liquid was detected.
 */
export function useFailedLabwareUtils({
  failedCommandByRunRecord,
  protocolAnalysis,
  failedPipetteInfo,
  runCommands,
  runRecord,
  allRunDefs,
}: UseFailedLabwareUtilsProps): UseFailedLabwareUtilsResult {
  const recentRelevantFailedLabwareCmd = useMemo(
    () =>
      getRelevantFailedLabwareCmdFrom({
        failedCommandByRunRecord,
        runCommands,
      }),
    [failedCommandByRunRecord?.key, runCommands?.meta.totalLength]
  )

  const tipSelectionUtils = useTipSelectionUtils(recentRelevantFailedLabwareCmd)

  const failedLabwareDetails = useMemo(
    () =>
      getFailedCmdRelevantLabware(
        protocolAnalysis,
        recentRelevantFailedLabwareCmd,
        runRecord
      ),
    [protocolAnalysis?.id, recentRelevantFailedLabwareCmd?.key]
  )

  const failedLabware = useMemo(
    () => getFailedLabware(recentRelevantFailedLabwareCmd, runRecord),
    [recentRelevantFailedLabwareCmd?.key]
  )

  const relevantWellName = getRelevantWellName(
    failedPipetteInfo,
    recentRelevantFailedLabwareCmd
  )

  const failedLabwareLocations = useRelevantFailedLwLocations({
    failedLabware,
    failedCommandByRunRecord,
    protocolAnalysis,
    allRunDefs,
  })

  return {
    ...tipSelectionUtils,
    failedLabwareName: failedLabwareDetails?.name ?? null,
    failedLabware,
    relevantWellName,
    failedLabwareNickname: failedLabwareDetails?.nickname ?? null,
    failedLabwareLocations,
  }
}

type FailedCommandRelevantLabware =
  | Omit<AspirateRunTimeCommand, 'result'>
  | Omit<DispenseRunTimeCommand, 'result'>
  | Omit<LiquidProbeRunTimeCommand, 'result'>
  | Omit<PickUpTipRunTimeCommand, 'result'>
  | Omit<MoveLabwareRunTimeCommand, 'result'>
  | null

interface RelevantFailedLabwareCmd {
  failedCommandByRunRecord: ErrorRecoveryFlowsProps['failedCommandByRunRecord']
  runCommands?: CommandsData
}

// Return the actual command that contains the info relating to the relevant labware.
export function getRelevantFailedLabwareCmdFrom({
  failedCommandByRunRecord,
  runCommands,
}: RelevantFailedLabwareCmd): FailedCommandRelevantLabware {
  const errorKind = getErrorKind(failedCommandByRunRecord)

  switch (errorKind) {
    case ERROR_KINDS.NO_LIQUID_DETECTED:
      return failedCommandByRunRecord as LiquidProbeRunTimeCommand
    case ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE:
    case ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING:
    case ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING:
      return getRelevantPickUpTipCommand(failedCommandByRunRecord, runCommands)
    case ERROR_KINDS.GRIPPER_ERROR:
      return failedCommandByRunRecord as MoveLabwareRunTimeCommand
    case ERROR_KINDS.GENERAL_ERROR:
      return null
    default:
      console.error(
        'No labware associated with failed command. Handle case explicitly.'
      )
      return null
  }
}

// Returns the most recent pickUpTip command for the pipette used in the failed command, if any.
function getRelevantPickUpTipCommand(
  failedCommandByRunRecord: ErrorRecoveryFlowsProps['failedCommandByRunRecord'],
  runCommands?: CommandsData
): Omit<PickUpTipRunTimeCommand, 'result'> | null {
  if (
    failedCommandByRunRecord == null ||
    runCommands == null ||
    !('wellName' in failedCommandByRunRecord.params) ||
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
    return recentPickUpTipCmd as Omit<PickUpTipRunTimeCommand, 'result'>
  }
}

interface UseTipSelectionUtilsResult {
  /* Always returns null if the relevant labware is not relevant to tip pick up. */
  selectedTipLocations: WellGroup | null
  tipSelectorDef: LabwareDefinition2
  selectTips: (tipGroup: WellGroup) => void
  deselectTips: (locations: string[]) => void
  areTipsSelected: boolean
}

// Utils for initializing and interacting with the Tip Selector component.
// Note: if the relevant failed labware command is not associated with tips, these utils effectively return `null`.
function useTipSelectionUtils(
  recentRelevantFailedLabwareCmd: FailedCommandRelevantLabware
): UseTipSelectionUtilsResult {
  const [selectedLocs, setSelectedLocs] = useState<WellGroup | null>(null)

  const initialLocs = useInitialSelectedLocationsFrom(
    recentRelevantFailedLabwareCmd
  )
  // Set the initial locs when they first become available.
  if (selectedLocs == null && initialLocs != null) {
    setSelectedLocs(initialLocs)
  }

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
    () => getAllLabwareDefs().thermoscientificnunc96Wellplate1300UlV1,
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

// Set the initial well selection to be the last pickup tip location for the pipette used in the failed command.
function useInitialSelectedLocationsFrom(
  recentRelevantFailedLabwareCmd: FailedCommandRelevantLabware
): WellGroup | null {
  const [initialWells, setInitialWells] = useState<WellGroup | null>(null)

  // Note that while other commands may have a wellName associated with them,
  // we are only interested in wells for the purposes of tip picking up.
  if (
    recentRelevantFailedLabwareCmd != null &&
    recentRelevantFailedLabwareCmd.commandType === 'pickUpTip' &&
    initialWells == null
  ) {
    setInitialWells({ [recentRelevantFailedLabwareCmd.params.wellName]: null })
  }

  return initialWells
}

// Get the name of the relevant labware relevant to the failed command, if any.
export function getFailedCmdRelevantLabware(
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis'],
  recentRelevantFailedLabwareCmd: FailedCommandRelevantLabware,
  runRecord?: Run
): { name: string; nickname: string | null } | null {
  const lwDefsByURI = getLoadedLabwareDefinitionsByUri(
    protocolAnalysis?.commands ?? []
  )
  const labwareNickname =
    protocolAnalysis != null
      ? getLoadedLabware(
          protocolAnalysis.labware,
          recentRelevantFailedLabwareCmd?.params.labwareId || ''
        )?.displayName ?? null
      : null
  const failedLWURI = runRecord?.data.labware.find(
    labware => labware.id === recentRelevantFailedLabwareCmd?.params.labwareId
  )?.definitionUri
  if (failedLWURI != null) {
    return {
      name: getLabwareDisplayName(lwDefsByURI[failedLWURI]),
      nickname: labwareNickname,
    }
  } else {
    return null
  }
}

// Get the relevant labware related to the failed command, if any.
function getFailedLabware(
  recentRelevantPickUpTipCmd: FailedCommandRelevantLabware,
  runRecord?: Run
): LoadedLabware | null {
  return (
    runRecord?.data.labware.find(
      lw => lw.id === recentRelevantPickUpTipCmd?.params.labwareId
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
    recentRelevantPickUpTipCmd.commandType === 'moveLabware'
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

type GetRelevantLwLocationsParams = Pick<
  UseFailedLabwareUtilsProps,
  'protocolAnalysis' | 'failedCommandByRunRecord' | 'allRunDefs'
> & {
  failedLabware: UseFailedLabwareUtilsResult['failedLabware']
}

export function useRelevantFailedLwLocations({
  failedLabware,
  failedCommandByRunRecord,
  protocolAnalysis,
  allRunDefs,
}: GetRelevantLwLocationsParams): RelevantFailedLabwareLocations {
  const { t } = useTranslation('protocol_command_text')

  const currentLocation = getLabwareDisplayLocation({
    loadedLabwares: protocolAnalysis?.labware ?? [],
    loadedModules: protocolAnalysis?.modules ?? [],
    location: failedLabware?.location ?? null,
    allRunDefs,
    robotType: FLEX_ROBOT_TYPE,
    t,
  })

  const getNewLocation = (): LabwareLocation | null => {
    switch (failedCommandByRunRecord?.commandType) {
      case 'moveLabware':
        return failedCommandByRunRecord.params.newLocation
      default:
        return null
    }
  }

  const newLocationByDisplayName = getLabwareDisplayLocation({
    loadedLabwares: protocolAnalysis?.labware ?? [],
    loadedModules: protocolAnalysis?.modules ?? [],
    location: getNewLocation(),
    allRunDefs,
    robotType: FLEX_ROBOT_TYPE,
    t,
  })

  return {
    currentLoc: currentLocation,
    newLoc:
      newLocationByDisplayName.length === 0 ? null : newLocationByDisplayName,
  }
}
