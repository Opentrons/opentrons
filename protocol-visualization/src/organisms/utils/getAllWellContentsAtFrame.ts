import mapValues from 'lodash/mapValues'

import { _wellContentsForLabware } from '@opentrons/step-generation'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  ContentsByWell,
  RobotState,
  SingleLabwareLiquidState,
} from '@opentrons/step-generation'

type WellContentsByLabware = Record<string, ContentsByWell>

export const getAllWellContentsAtFrame = (
  liquidState: RobotState['liquidState'],
  labwareDef: LabwareDefinition2
): WellContentsByLabware => {
  const labwareLiquidState = liquidState.labware
  const wellContentsByLabwareId = mapValues(
    labwareLiquidState,
    (labwareLiquids: SingleLabwareLiquidState, labwareId: string) => {
      return _wellContentsForLabware(labwareLiquids, labwareDef)
    }
  )
  return wellContentsByLabwareId
}
