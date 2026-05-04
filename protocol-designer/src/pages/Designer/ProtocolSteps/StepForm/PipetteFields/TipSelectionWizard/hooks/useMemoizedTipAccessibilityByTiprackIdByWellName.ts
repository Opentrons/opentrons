import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { ALL, COLUMN, ROW } from '@opentrons/shared-data'
import {
  getIsSafePickupWithinTiprack,
  getIsSafePipetteMovement,
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
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { AccessibilityStatus, InaccessibleReason } from '../types'

export const getWellsToCheck = (
  nozzles: NozzleConfigurationStyle,
  wellOrdering: string[][],
  channels: ActiveNozzleNumber
): string[] => {
  if (channels === 96 && nozzles === ALL) {
    return [wellOrdering.flat()[0]]
  } else if (nozzles === ROW) {
    return wellOrdering[0]
  } else if (nozzles === COLUMN || (channels === 8 && nozzles === ALL)) {
    return wellOrdering.map(row => row[0])
  } else {
    return wellOrdering.flat()
  }
}

/**
 * Returns a record of tip accessibility status by  tiprack id and well name.
 * Example return:
 * {
 *   'tiprack1Id': {
 *     'A1': {isAccessible: true},
 *     'A2': {isAccessible: false, inaccessibleReason: 'incomplete'},
 *   },
 *   'tiprack2Id': {
 *     'A1': {isAccessible: true},
 *     'A2': {isAccessible: false, inaccessibleReason: 'collision'},
 *   },
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
  const { labwareEntities } = invariantContext

  return useMemo(
    () => {
      if (robotState == null) {
        return {}
      }
      return Object.entries(robotState.labware).reduce<
        Record<string, Record<string, AccessibilityStatus>>
      >((acc, [id, { stack }]) => {
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
          pipetteChannels
        )
        return {
          ...acc,
          [id]: wellNamesToCheck.reduce((acc, wellName) => {
            const { isSafe, isComplete } = getIsSafePickupWithinTiprack({
              tipState,
              primaryNozzle,
              channels: pipetteChannels,
              nozzleConfiguration: nozzles,
              wellName,
              tiprackDef: def,
              tipsToIgnore: selectedTips.flat(),
            })
            const isCollision = !getIsSafePipetteMovement({
              robotState,
              invariantContext,
              pipetteId,
              labwareId: id,
              wellTargetName: wellName,
              primaryNozzle,
              nozzleConfiguration: nozzles,
            })
            const isAccessible = isSafe && isComplete && !isCollision
            let inaccessibleReason: InaccessibleReason | null = null
            if (isCollision) {
              inaccessibleReason = INACCESSIBLE_COLLISION
            } else if (!isSafe) {
              inaccessibleReason = INACCESSIBLE_TOO_MANY_PICKUPS
            } else if (!isComplete) {
              inaccessibleReason = INACCESSIBLE_INCOMPLETE
            }
            const wellGroup = getEntireWellSelection(
              wellName,
              def.ordering,
              nozzles,
              primaryNozzle,
              pipetteChannels
            )
            const groupEntries = Object.fromEntries(
              wellGroup.map(well => [
                well,
                {
                  isAccessible,
                  ...(inaccessibleReason != null ? { inaccessibleReason } : {}),
                },
              ])
            )

            return {
              ...acc,
              ...groupEntries,
            }
          }, {}),
        }
      }, {})
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedTips]
  )
}
