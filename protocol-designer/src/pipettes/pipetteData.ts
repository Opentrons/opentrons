import assert from 'assert'
import { DropdownOption } from '../../../components/lib/forms/DropdownField.d'
import {
  getPipetteNameSpecs,
  getTiprackVolume,
  PipetteName,
  getLabwareDefURI,
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
  .map((name: PipetteName) => {
    const pipette = getPipetteNameSpecs(name)
    return pipette
      ? {
          name: pipette.displayName,
          value: pipette.name,
        }
      : null
  })
  .filter<DropdownOption>(
    (option: DropdownOption | null): option is DropdownOption => Boolean(option)
  )

// NOTE: this is similar to getPipetteWithTipMaxVol, the fns could potentially
// be merged once multiple tiprack types per pipette is supported
export function getPipetteCapacity(
  pipetteEntity: PipetteEntity,
  tipRack?: string | null
): number {
  const spec = pipetteEntity.spec
  const tiprackDefs = pipetteEntity.tiprackLabwareDef
  const tipRackDefUri = tipRack?.split(':')[1]
  let chosenTipRack = null
  for (const def of tiprackDefs) {
    if (getLabwareDefURI(def) === tipRackDefUri) {
      chosenTipRack = def
      break
    }
  }
  if (spec && tiprackDefs) {
    return Math.min(
      spec.maxVolume,
      //  not sure if this is a good way to handle this. chosenTipRack is null until you select it
      getTiprackVolume(chosenTipRack ?? tiprackDefs[0])
    )
  }
  assert(
    false,
    `Expected spec and tiprack def for pipette ${
      pipetteEntity ? pipetteEntity.id : '???'
    } and ${tipRack ? tipRack : '???'}`
  )
  return NaN
}
export function getMinPipetteVolume(pipetteEntity: PipetteEntity): number {
  const spec = pipetteEntity.spec

  if (spec) {
    return spec.minVolume
  }

  assert(
    false,
    `Expected spec for pipette ${pipetteEntity ? pipetteEntity.id : '???'}`
  )
  return NaN
}
