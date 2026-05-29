import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  ALL,
  COLUMN,
  PARTIAL_COLUMN,
  PARTIAL_NOZZLE_MAP,
  ROW,
} from '@opentrons/shared-data'
import {
  getIsSafePickupWithinTiprack,
  getPipetteMovementSafetyStatus,
} from '@opentrons/step-generation'

import { OFFDECK } from '/protocol-designer/constants'
import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import { getEntireWellSelection } from '../../NozzleAndWellSelectionModal/utils'
import {
  INACCESSIBLE_COLLISION,
  INACCESSIBLE_INCOMPLETE,
  INACCESSIBLE_TOO_MANY_PICKUPS,
} from '../constants'

import type {
  ActiveNozzleNumber,
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { AccessibilityStatus, InaccessibleReason } from '../types'

export const getWellsToCheck = (
  nozzles: NozzleConfigurationStyle,
  wellOrdering: string[][],
  channels: ActiveNozzleNumber,
  primaryNozzle?: PrimaryNozzleConfigurationStyle
): string[] => {
  if (channels === 96 && nozzles === ALL) {
    return [wellOrdering.flat()[0]]
  } else if (nozzles === ROW) {
    return wellOrdering[0]
  } else if (nozzles === COLUMN || (channels === 8 && nozzles === ALL)) {
    return wellOrdering.map(col => col[0])
  } else if (nozzles === PARTIAL_COLUMN && primaryNozzle != null) {
    // partial column config
    const nozzleCount =
      PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles]
    const isSingleColumn = wellOrdering.length === 1
    return wellOrdering.flatMap(column => {
      if (isSingleColumn) {
        return column
      }
      // find only valid primaries such that the nozzles wouldn't "fall off" the labware
      // for example, if you have 3 nozzles configured, the only valid wells to check
      // are column wells A-F (targeting G + H does not supply enough wells)
      const uniqueCount = Math.max(1, column.length - nozzleCount + 1)
      return column.slice(0, uniqueCount)
    })
  } else {
    return wellOrdering.flat()
  }
}

/**
 * Returns accessibility status keyed by tiprack id and PRIMARY well name.
 * Each entry contains `affectedWells` (the full set of wells the pipette
 * would pick up from that primary target) plus `isAccessible` / `inaccessibleReason`.
 *
 * Only primary wells are keys — cascading wells are represented through
 * `affectedWells` on their respective primary entry.
 */
export const useMemoizedTipAccessibilityByTiprackIdByWellName = (args: {
  nozzles: NozzleConfigurationStyle
  pipetteSpecs: PipetteV2Specs
  selectedTips: string[][]
  primaryNozzle: PrimaryNozzleConfigurationStyle
  pipetteId: string
  tiprackUri: string
}): Record<string, Record<string, AccessibilityStatus>> => {
  const {
    nozzles,
    pipetteSpecs,
    selectedTips,
    primaryNozzle,
    pipetteId,
    tiprackUri,
  } = args
  const robotState = useSelector(getRobotStateAtActiveItem)
  const invariantContext = useSelector(getInvariantContext)

  return useMemo(() => {
    if (robotState == null) {
      return {}
    }
    return Object.entries(robotState.labware).reduce<
      Record<string, Record<string, AccessibilityStatus>>
    >((acc, [id, { stack }]) => {
      const { labwareEntities } = invariantContext
      const { def, labwareDefURI } = labwareEntities[id]
      const isMatchingTiprackOnDeck =
        !stack.includes(OFFDECK) &&
        def.parameters.isTiprack &&
        labwareDefURI === tiprackUri
      if (!isMatchingTiprackOnDeck) {
        return acc
      }
      const tipState = robotState?.tipState.tipracks[id] ?? null
      if (tipState == null) {
        return acc
      }
      const pipetteChannels = pipetteSpecs.channels
      const wellNamesToCheck = getWellsToCheck(
        nozzles,
        def.ordering,
        pipetteChannels,
        primaryNozzle
      )
      return {
        ...acc,
        [id]: wellNamesToCheck.reduce<Record<string, AccessibilityStatus>>(
          (tiprackAcc, wellName) => {
            const { isSafe, isComplete } = getIsSafePickupWithinTiprack({
              tipState,
              primaryNozzle,
              channels: pipetteChannels,
              nozzleConfiguration: nozzles,
              wellName,
              tiprackDef: def,
              tipsToIgnore: selectedTips.flat(),
            })
            const isCollision = !getPipetteMovementSafetyStatus({
              robotState,
              invariantContext,
              pipetteId,
              labwareId: id,
              wellTargetName: wellName,
              primaryNozzle,
              nozzleConfiguration: nozzles,
            }).isSafe
            const isAccessible = isSafe && isComplete === true && !isCollision
            const affectedWells = getEntireWellSelection(
              wellName,
              def.ordering,
              nozzles,
              primaryNozzle,
              pipetteChannels
            )

            let status: AccessibilityStatus
            if (isAccessible) {
              status = { isAccessible: true, affectedWells }
            } else {
              let inaccessibleReason: InaccessibleReason
              if (isCollision) {
                inaccessibleReason = INACCESSIBLE_COLLISION
              } else if (!isSafe) {
                inaccessibleReason = INACCESSIBLE_TOO_MANY_PICKUPS
              } else {
                inaccessibleReason = INACCESSIBLE_INCOMPLETE
              }
              status = {
                isAccessible: false,
                affectedWells,
                inaccessibleReason,
              }
            }

            return { ...tiprackAcc, [wellName]: status }
          },
          {}
        ),
      }
    }, {})
  }, [
    robotState,
    invariantContext,
    nozzles,
    primaryNozzle,
    pipetteSpecs,
    pipetteId,
    tiprackUri,
    selectedTips,
  ])
}
