// @flow
import StaticLabware from './StaticLabware'
import WellLabels from './WellLabels'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export { StaticLabware, WellLabels }

type WellFillProps = {
  definition: LabwareDefinition2,
  fillByWell: { [wellName: string]: string },
}

// TODO IMMEDIATELY
export function WellFill(props: WellFillProps) {
  return null
}

type WellStrokeProps = {
  definition: LabwareDefinition2,
  wells: Set<string>,
  strokeType: 'highlight',
}

// TODO IMMEDIATELY
export function WellStroke(props: WellStrokeProps) {
  return null
}
