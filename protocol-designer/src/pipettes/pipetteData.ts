import { DropdownOption } from '../../../components/lib/forms/DropdownField.d'
import {
  getPipetteSpecsV2,
  getTiprackVolume,
  PipetteName,
} from '@opentrons/shared-data'
import { Options } from '@opentrons/components'
import { PipetteEntity } from '@opentrons/step-generation'
const supportedPipetteNames: PipetteName[] = [
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
  .map(name => {
    const pipette = getPipetteSpecsV2(name)
    return pipette
      ? {
          name: pipette.displayName,
          value: name as string,
        }
      : null
  })
  .filter<DropdownOption>(
    (option: DropdownOption | null): option is DropdownOption => Boolean(option)
  )

// NOTE: this is similar to getPipetteWithTipMaxVol, the fns could potentially
// be merged once multiple tiprack types per pipette is supported
export function getPipetteCapacity(pipetteEntity: PipetteEntity): number {
  const spec = pipetteEntity.spec
  const tiprackDef = pipetteEntity.tiprackLabwareDef

  if (spec && tiprackDef) {
    return Math.min(
      spec.liquids.default.maxVolume,
      getTiprackVolume(tiprackDef)
    )
  }

  console.assert(
    false,
    `Expected spec and tiprack def for pipette ${
      pipetteEntity ? pipetteEntity.id : '???'
    }`
  )
  return NaN
}

export function getMinPipetteVolume(pipetteEntity: PipetteEntity): number {
  const spec = pipetteEntity.spec

  const minVolumes =
    spec != null
      ? Object.values(spec.liquids).map(liquid => liquid.minVolume)
      : []
  let recommendedMinimumDisposalVol: number = 0
  if (minVolumes.length === 1) {
    recommendedMinimumDisposalVol = minVolumes[0]
    //  to accommodate for lowVolume
  } else {
    const lowestVolume = Math.min(...minVolumes)
    recommendedMinimumDisposalVol = lowestVolume
  }

  if (spec != null) {
    return recommendedMinimumDisposalVol
  }

  console.assert(
    false,
    `Expected spec for pipette ${pipetteEntity ? pipetteEntity.id : '???'}`
  )
  return NaN
}
