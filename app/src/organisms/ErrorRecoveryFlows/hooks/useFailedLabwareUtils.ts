import * as React from 'react'
import without from 'lodash/without'

import {
  getAllLabwareDefs,
  getLabwareDisplayName,
  getLoadedLabwareDefinitionsByUri,
} from '@opentrons/shared-data'

import type { WellGroup } from '@opentrons/components'
import type { CommandsData, PipetteData, Run } from '@opentrons/api-client'
import type {
  LabwareDefinition2,
  LoadedLabware,
  PickUpTipRunTimeCommand,
} from '@opentrons/shared-data'
import type { ErrorRecoveryFlowsProps } from '..'

interface UseFailedLabwareUtilsProps {
  failedCommand: ErrorRecoveryFlowsProps['failedCommand']
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
  failedPipetteInfo: PipetteData | null
  runCommands?: CommandsData
  runRecord?: Run
}

export type UseFailedLabwareUtilsResult = UseTipSelectionUtilsResult & {
  /* The name of the labware from which the tip(s) involved in the failed command were picked up, if any.  */
  pickUpTipLabwareName: string | null
  /* Info for the labware from which the tip(s) involved in the failed command were picked up, if any. */
  pickUpTipLabware: LoadedLabware | null
  /* The name of the well(s) from which the tip(s) involved in the failed command were picked up, if any. */
  relevantPickUpTipWellName: string | null
}

// Utils for labware relating to the failedCommand.
export function useFailedLabwareUtils({
  failedCommand,
  protocolAnalysis,
  failedPipetteInfo,
  runCommands,
  runRecord,
}: UseFailedLabwareUtilsProps): UseFailedLabwareUtilsResult {
  const recentRelevantPickUpTipCmd = React.useMemo(
    () => getRecentRelevantPickUpTipCommand(failedCommand, runCommands),
    [failedCommand, runCommands]
  )

  const tipSelectionUtils = useTipSelectionUtils(recentRelevantPickUpTipCmd)

  const pickUpTipLabwareName = React.useMemo(
    () =>
      getPickUpTipLabwareName(
        protocolAnalysis,
        recentRelevantPickUpTipCmd,
        runRecord
      ),
    [protocolAnalysis, recentRelevantPickUpTipCmd, runRecord]
  )

  const pickUpTipLabware = React.useMemo(
    () => getPickUpTipLabware(recentRelevantPickUpTipCmd, runRecord),
    [recentRelevantPickUpTipCmd, runRecord]
  )

  const relevantPickUpTipWellName = getPickUpTipCommandWellName(
    failedPipetteInfo,
    recentRelevantPickUpTipCmd
  )

  return {
    ...tipSelectionUtils,
    pickUpTipLabwareName,
    pickUpTipLabware,
    relevantPickUpTipWellName,
  }
}

// Returns the most recent pickUpTip command for the pipette used in the failed command, if any.
function getRecentRelevantPickUpTipCommand(
  failedCommand: ErrorRecoveryFlowsProps['failedCommand'],
  runCommands?: CommandsData
): Omit<PickUpTipRunTimeCommand, 'result'> | null {
  if (
    failedCommand == null ||
    runCommands == null ||
    !('wellName' in failedCommand.params) ||
    !('pipetteId' in failedCommand.params)
  ) {
    return null
  }

  const failedCmdPipetteId = failedCommand.params.pipetteId

  // Reverse iteration is faster as long as # recovery commands < # run commands.
  const failedCommandIdx = runCommands.data.findLastIndex(
    command => command.key === failedCommand.key
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
  selectedTipLocations: WellGroup | null
  tipSelectorDef: LabwareDefinition2
  selectTips: (tipGroup: WellGroup) => void
  deselectTips: (locations: string[]) => void
}

// Utils for initializing and interacting with the Tip Selector component.
function useTipSelectionUtils(
  recentRelevantPickUpTipCmd: Omit<PickUpTipRunTimeCommand, 'result'> | null
): UseTipSelectionUtilsResult {
  const [selectedLocs, setSelectedLocs] = React.useState<WellGroup | null>(null)

  const initialLocs = useInitialSelectedLocationsFrom(
    recentRelevantPickUpTipCmd
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
  const tipSelectorDef = React.useMemo(
    () => getAllLabwareDefs().thermoscientificnunc96Wellplate1300UlV1,
    []
  )

  return {
    selectedTipLocations: selectedLocs,
    tipSelectorDef,
    selectTips,
    deselectTips,
  }
}

// Set the initial well selection to be the last pickup tip location for the pipette used in the failed command.
function useInitialSelectedLocationsFrom(
  recentRelevantPickUpTipCmd: Omit<PickUpTipRunTimeCommand, 'result'> | null
): WellGroup | null {
  const [initialWells, setInitialWells] = React.useState<WellGroup | null>(null)

  if (recentRelevantPickUpTipCmd != null && initialWells == null) {
    setInitialWells({ [recentRelevantPickUpTipCmd.params.wellName]: null })
  }

  return initialWells
}

// Get the name of the latest labware used by the failed command's pipette to pick up tips, if any.
export function getPickUpTipLabwareName(
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis'],
  recentRelevantPickUpTipCmd: Omit<PickUpTipRunTimeCommand, 'result'> | null,
  runRecord?: Run
): string | null {
  const lwDefsByURI = getLoadedLabwareDefinitionsByUri(
    protocolAnalysis?.commands ?? []
  )
  const pickUpTipLWURI = runRecord?.data.labware.find(
    labware => labware.id === recentRelevantPickUpTipCmd?.params.labwareId
  )?.definitionUri
  if (pickUpTipLWURI != null) {
    return getLabwareDisplayName(lwDefsByURI[pickUpTipLWURI])
  } else {
    return null
  }
}

// Get the latest labware used by the failed command's pipette to pick up tips, if any.
function getPickUpTipLabware(
  recentRelevantPickUpTipCmd: Omit<PickUpTipRunTimeCommand, 'result'> | null,
  runRecord?: Run
): LoadedLabware | null {
  return (
    runRecord?.data.labware.find(
      lw => lw.id === recentRelevantPickUpTipCmd?.params.labwareId
    ) ?? null
  )
}

// Return the name of the well(s) from which the tip(s) involved in the failed command were picked up, if any.
export function getPickUpTipCommandWellName(
  failedPipetteInfo: UseFailedLabwareUtilsProps['failedPipetteInfo'],
  recentRelevantPickUpTipCmd: Omit<PickUpTipRunTimeCommand, 'result'> | null
): string {
  if (failedPipetteInfo == null || recentRelevantPickUpTipCmd == null) {
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
