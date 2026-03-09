import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  getIsSafePickupWithinTiprack,
  getIsSafePipetteMovement,
} from '@opentrons/step-generation'

import { OFFDECK } from '/protocol-designer/constants'
import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
} from '@opentrons/shared-data'

/**
 * Returns a record of tip accessibility status by  tiprack id and well name.
 * Example return:
 * {
 *   'tiprack1Id': {
 *     'A1': true,
 *     'A2': false,
 *   },
 *   'tiprack2Id': {
 *     'A1': true,
 *     'A2': false,
 *   },
 */
export const useMemoizedTipAccessibilityByTiprackIdByWellName = (args: {
  nozzles: NozzleConfigurationStyle
  pipetteSpecs: PipetteV2Specs
  selectedTips: string[][]
  primaryNozzle: string
  pipetteId: string
  tiprackUri: string
}): Record<string, Record<string, boolean>> => {
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
      Record<string, Record<string, boolean>>
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
          return {
            ...acc,
            [wellName]:
              // check accessibility of tips in tiprack
              isSafe &&
              // check if tip(s) is/are not empty
              isComplete &&
              // check if pipette movement is safe relative to surrounding labware and pipette bounds
              getIsSafePipetteMovement({
                robotState,
                invariantContext,
                pipetteId,
                labwareId: id,
                wellTargetName: wellName,
                primaryNozzle,
                nozzleConfiguration: nozzles,
              }),
          }
        }, {}),
      }
    }, {})
  }, [selectedTips])
}
