// @flow
import assert from 'assert'
import { getPipetteNameSpecs, getTiprackVolume } from '@opentrons/shared-data'
import type { Options } from '@opentrons/components'
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
export const pipetteOptions: Options = supportedPipetteNames
  .map((name: string) => {
    const pipette = getPipetteNameSpecs(name)
    return pipette ? { name: pipette.displayName, value: pipette.name } : null
  })
  .filter(Boolean)

// NOTE: this is similar to getPipetteWithTipMaxVol, the fns could potentially
// be merged once multiple tiprack types per pipette is supported
export function getPipetteCapacity(pipetteEntity: PipetteEntity): number {
  const spec = pipetteEntity.spec
  const tiprackDef = pipetteEntity.tiprackLabwareDef
  if (spec && tiprackDef) {
    return Math.min(spec.maxVolume, getTiprackVolume(tiprackDef))
  }
  assert(
    false,
    `Expected spec and tiprack def for pipette ${
      pipetteEntity ? pipetteEntity.id : '???'
    }`
  )
  return NaN
}
