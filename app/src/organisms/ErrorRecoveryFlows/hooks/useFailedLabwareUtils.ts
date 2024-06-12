import * as React from 'react'
import without from 'lodash/without'

import { getAllLabwareDefs } from '@opentrons/shared-data'

import { getLabwareName } from '../../CommandText/utils'

import type { WellGroup } from '@opentrons/components'
import type { CommandsData } from '@opentrons/api-client'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { ErrorRecoveryFlowsProps } from '..'

interface UseFailedLabwareUtilsProps {
  failedCommand: ErrorRecoveryFlowsProps['failedCommand']
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
  runCommands?: CommandsData
}

export type UseFailedLabwareUtilsResult = UseTipSelectionUtilsResult & {
  failedLabwareName: string | null
}

// Utils for labware relating to the failedCommand.
export function useFailedLabwareUtils(
  props: UseFailedLabwareUtilsProps
): UseFailedLabwareUtilsResult {
  const tipSelectionUtils = useTipSelectionUtils(props)
  const failedLabwareName = getFailedLabwareName(props)

  return {
    ...tipSelectionUtils,
    failedLabwareName,
  }
}

interface UseTipSelectionUtilsResult {
  selectedTipLocations: WellGroup | null
  tipSelectorDef: LabwareDefinition2
  selectTips: (tipGroup: WellGroup) => void
  deselectTips: (locations: string[]) => void
}

// Utils for initializing and interacting with the Tip Selector component.
function useTipSelectionUtils({
  failedCommand,
  runCommands,
}: UseFailedLabwareUtilsProps): UseTipSelectionUtilsResult {
  const [selectedLocs, setSelectedLocs] = React.useState<WellGroup | null>(null)

  const initialLocs = useInitialSelectedLocationsFrom(
    failedCommand,
    runCommands
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
  const tipSelectorDef = getAllLabwareDefs()
    .thermoscientificnunc96Wellplate1300UlV1

  return {
    selectedTipLocations: selectedLocs,
    tipSelectorDef,
    selectTips,
    deselectTips,
  }
}

// Find the most recent tip pick up command for the pipette in the failed command, and set the initial well as the same
// pickup location.
function useInitialSelectedLocationsFrom(
  failedCommand: ErrorRecoveryFlowsProps['failedCommand'],
  runCommands?: CommandsData
): WellGroup | null {
  const [initialWells, setInitialWells] = React.useState<WellGroup | null>(null)
  if (
    failedCommand != null &&
    runCommands != null &&
    initialWells == null &&
    'wellName' in failedCommand.params &&
    'pipetteId' in failedCommand.params
  ) {
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

    if (recentPickUpTipCmd != null && 'wellName' in recentPickUpTipCmd.params) {
      setInitialWells({ [recentPickUpTipCmd.params.wellName]: null })
    }
  }

  return initialWells
}

// TODO(jh 06-12-24): See EXEC-525.
// Get the name of the labware used in the failed command, if any.
function getFailedLabwareName({
  failedCommand,
  protocolAnalysis,
}: UseFailedLabwareUtilsProps): string | null {
  if (
    failedCommand == null ||
    protocolAnalysis == null ||
    !('labwareId' in failedCommand.params)
  ) {
    return null
  } else {
    return getLabwareName(protocolAnalysis, failedCommand.params.labwareId)
  }
}
