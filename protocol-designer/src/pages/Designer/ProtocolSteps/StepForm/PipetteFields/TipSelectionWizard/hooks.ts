import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  getIsSafePickupWithinTiprack,
  getIsSafePipetteMovement,
} from '@opentrons/step-generation'

import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
} from '@opentrons/shared-data'

export const useMemoizedTipAccessibileStatusByWellName = (args: {
  selectedTiprackId: string
  nozzles: NozzleConfigurationStyle
  pipetteSpecs: PipetteV2Specs
  selectedTips: string[][]
  primaryNozzle: string
  pipetteId: string
}): Record<string, boolean> => {
  const {
    selectedTiprackId,
    nozzles,
    pipetteSpecs,
    selectedTips,
    primaryNozzle,
    pipetteId,
  } = args
  const robotState = useSelector(getRobotStateAtActiveItem)
  const invariantContext = useSelector(getInvariantContext)
  const { labwareEntities } = invariantContext
  const labwareDef = labwareEntities[selectedTiprackId]?.def
  const tipState = robotState?.tipState.tipracks[selectedTiprackId ?? ''] ?? {}

  return useMemo(
    () =>
      Object.keys(labwareDef.wells).reduce(
        (acc, wellName) => ({
          ...acc,
          [wellName]:
            robotState != null &&
            selectedTiprackId != null &&
            // check presence of tips in tiprack
            getIsSafePickupWithinTiprack({
              tipState,
              primaryNozzle,
              channels: pipetteSpecs.channels,
              nozzleConfiguration: nozzles,
              wellName,
              tiprackDef: labwareDef,
              tipsToIgnore: selectedTips.flat(),
            }) &&
            // check if pipette movement is safe relative to surrounding labware and pipette bounds
            getIsSafePipetteMovement({
              robotState,
              invariantContext,
              pipetteId: pipetteId,
              labwareId: selectedTiprackId,
              wellLocationOffset: { x: 0, y: 0 },
              wellTargetName: wellName,
              primaryNozzle,
              nozzleConfiguration: nozzles,
            }),
        }),
        {}
      ),
    [selectedTips]
  )
}
