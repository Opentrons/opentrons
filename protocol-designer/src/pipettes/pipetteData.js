// @flow
import compact from 'lodash/compact'
import { getPipetteNameSpecs, getLabware } from '@opentrons/shared-data'
import type { PipetteEntity } from '../step-forms/types'

const supportedPipetteNames = [
  'p10_single',
  'p10_multi',
  'p50_single',
  'p50_multi',
  'p300_single',
  'p300_multi',
  'p1000_single',
]

// TODO: should a version of pipetteOptions be moved to shared-data,
// and used for both PD and Run App?
export const pipetteOptions = compact(
  supportedPipetteNames.map((name: string) => {
    const pipette = getPipetteNameSpecs(name)
    return pipette ? { name: pipette.displayName, value: pipette.name } : null
  })
)

// NOTE: this is similar to getPipetteWithTipMaxVol, the fns could potentially
// be merged once multiple tiprack types per pipette is supported
export function getPipetteCapacity(
  pipetteEntity: PipetteEntity
): number {
  const specs = getPipetteNameSpecs(pipetteEntity.name)
  const tiprackDef = getLabware(pipetteEntity.tiprackModel)
  if (specs && tiprackDef && tiprackDef.metadata.tipVolume) {
    return Math.min(specs.maxVolume, tiprackDef.metadata.tipVolume)
  }
  return NaN
}
