import { useSelector } from 'react-redux'

import {
  NozzleConfigurationStyle,
  PipetteChannels,
} from '@opentrons/shared-data'
import {
  getIsSafePickupWithinTiprack,
  getIsSafePipetteMovement,
} from '@opentrons/step-generation'

import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import {
  getAffectedWells,
  getIsPickupCompatibleWithPossibleAdapter,
} from '../utils'

export const useValidTiprackIds = (args: {
  pipetteId: string
  nozzles: NozzleConfigurationStyle
  channels: PipetteChannels
  numPickups: number
  primaryNozzle: string
  tipAccessibilityStatus: Record<string, Record<string, boolean>>
}): string[] => {
  const {
    pipetteId,
    nozzles,
    channels,
    numPickups,
    primaryNozzle,
    tipAccessibilityStatus,
  } = args
  const invariantContext = useSelector(getInvariantContext)
  const { labwareEntities } = invariantContext
  const robotState = useSelector(getRobotStateAtActiveItem)
  const validTiprackIds = Object.keys(tipAccessibilityStatus).reduce<string[]>(
    (acc, id) => {
      const tiprackDef = labwareEntities[id].def
      const tipState = robotState?.tipState.tipracks[id] ?? {}
      const stack = robotState?.labware[id]?.stack
      const isPickupCompatibleWithPossibleAdapter =
        stack != null
          ? getIsPickupCompatibleWithPossibleAdapter(
              stack,
              labwareEntities,
              nozzles,
              channels
            )
          : true
      if (!isPickupCompatibleWithPossibleAdapter) {
        return acc
      }

      let isValidTiprack: boolean = true
      const addedWells: string[] = []
      for (let pickupIndex = 0; pickupIndex < numPickups; pickupIndex++) {
        const wellsToTraverse = Object.keys(tiprackDef.wells)
        let foundSafePickup = false
        for (const wellName of wellsToTraverse) {
          const { isSafe: isSafeWithinTiprack, isComplete } =
            getIsSafePickupWithinTiprack({
              tipState,
              primaryNozzle,
              channels,
              nozzleConfiguration: nozzles,
              wellName,
              tiprackDef: tiprackDef,
              tipsToIgnore: addedWells,
            })
          const isSafeMoveConsideringDeck =
            robotState != null
              ? getIsSafePipetteMovement({
                  robotState,
                  invariantContext,
                  pipetteId,
                  labwareId: id,
                  wellTargetName: wellName,
                  primaryNozzle,
                  nozzleConfiguration: nozzles,
                })
              : true
          if (isSafeWithinTiprack && isSafeMoveConsideringDeck && isComplete) {
            const allAffectedWells = getAffectedWells({
              wellName,
              labwareDef: tiprackDef,
              channels,
              nozzles,
            })
            addedWells.push(...allAffectedWells)
            foundSafePickup = true
            break // Found a safe pickup for this iteration, move to next pickup
          }
        }

        // If we didn't find a safe pickup for this iteration, the tiprack is invalid
        if (!foundSafePickup) {
          isValidTiprack = false
          break // Stop checking this tiprack entirely
        }
      }

      return isValidTiprack ? [...acc, id] : acc
    },
    []
  )
  return validTiprackIds
}
