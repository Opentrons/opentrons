import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  getIsSafePickupWithinTiprack,
  getIsSafePipetteMovement,
} from '@opentrons/step-generation'

import { OFFDECK } from '/protocol-designer/constants'
import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import {
  INACCESSIBLE_COLLISION,
  INACCESSIBLE_INCOMPLETE,
  INACCESSIBLE_TOO_MANY_PICKUPS,
} from '../constants'

import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
} from '@opentrons/shared-data'
import type { AccessibilityStatus, InaccessibleReason } from '../types'

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
  primaryNozzle: string
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

  return useMemo(() => {
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
      return {
        ...acc,
        [id]: Object.keys(def.wells).reduce((acc, wellName) => {
          const { isSafe, isComplete } = getIsSafePickupWithinTiprack({
            tipState,
            primaryNozzle,
            channels: pipetteSpecs.channels,
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
          return {
            ...acc,
            [wellName]: {
              isAccessible,
              ...(inaccessibleReason != null ? { inaccessibleReason } : {}),
            },
          }
        }, {}),
      }
    }, {})
  }, [selectedTips])
}
