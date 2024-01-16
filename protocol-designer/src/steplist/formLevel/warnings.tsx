import * as React from 'react'
import { getWellTotalVolume } from '@opentrons/shared-data'
import { KnowledgeBaseLink } from '../../components/KnowledgeBaseLink'
import { FormError } from './errors'
/*******************
 ** Warning Messages **
 ********************/

export type FormWarningType =
  | 'BELOW_PIPETTE_MINIMUM_VOLUME'
  | 'OVER_MAX_WELL_VOLUME'
  | 'BELOW_MIN_DISPOSAL_VOLUME'
  | 'BELOW_MIN_AIR_GAP_VOLUME'

export type FormWarning = FormError & {
  type: FormWarningType
}

const belowMinAirGapVolumeWarning = (min: number): FormWarning => ({
  type: 'BELOW_MIN_AIR_GAP_VOLUME',
  title: `Air gap volume is below pipette minimum (${min}} uL)`,
  body: <>{'Pipettes cannot accurately handle volumes below their minimum.'}</>,
  dependentFields: ['disposalVolume_volume', 'pipette'],
})

const belowPipetteMinVolumeWarning = (min: number): FormWarning => ({
  type: 'BELOW_PIPETTE_MINIMUM_VOLUME',
  title: `Disposal volume is below recommended minimum (${min}} uL)`,
  body: (
    <>
      {
        'For accuracy in multi-dispense Transfers we recommend you use a disposal volume of at least the pipette`s minimum. Read more '
      }
    </>
  ),
  dependentFields: ['pipette', 'volume'],
})

const overMaxWellVolumeWarning = (): FormWarning => ({
  type: 'OVER_MAX_WELL_VOLUME',
  title: 'Dispense volume will overflow a destination well',
  dependentFields: ['dispense_labware', 'dispense_wells', 'volume'],
})

const belowMinDisposalVolumeWarning = (min: number): FormWarning => ({
  type: 'BELOW_MIN_DISPOSAL_VOLUME',
  title: `Disposal volume is below recommended minimum (${min}} uL)`,
  body: (
    <>
      {
        'For accuracy in multi-dispense Transfers we recommend you use a disposal volume of at least the pipette`s minimum. Read more '
      }
      <KnowledgeBaseLink to="multiDispense">{'here'}</KnowledgeBaseLink>.
    </>
  ),
  dependentFields: ['disposalVolume_volume', 'pipette'],
})

export type WarningChecker = (val: unknown) => FormWarning | null

/*******************
 ** Warning Checkers **
 ********************/
// TODO: real HydratedFormData type
export type HydratedFormData = any

export const belowPipetteMinimumVolume = (
  fields: HydratedFormData
): FormWarning | null => {
  const { pipette, volume } = fields
  if (!(pipette && pipette.spec)) return null
  return volume < pipette.spec.minVolume
    ? belowPipetteMinVolumeWarning(pipette.spec.minVolume)
    : null
}

export const maxDispenseWellVolume = (
  fields: HydratedFormData
): FormWarning | null => {
  const { dispense_labware, dispense_wells, volume } = fields
  if (!dispense_labware || !dispense_wells) return null
  const hasExceeded = dispense_wells.some((well: string) => {
    const maximum =
      'name' in dispense_labware &&
      (dispense_labware.name === 'wasteChute' ||
        dispense_labware.name === 'trashBin')
        ? Infinity // some randomly selected high number since waste chute is huge
        : getWellTotalVolume(dispense_labware.def, well)
    return maximum && volume > maximum
  })
  return hasExceeded ? overMaxWellVolumeWarning() : null
}

export const minDisposalVolume = (
  fields: HydratedFormData
): FormWarning | null => {
  const {
    disposalVolume_checkbox,
    disposalVolume_volume,
    pipette,
    path,
  } = fields
  if (!(pipette && pipette.spec) || path !== 'multiDispense') return null
  const isUnselected = !disposalVolume_checkbox || !disposalVolume_volume
  if (isUnselected) return belowMinDisposalVolumeWarning(pipette.spec.minVolume)
  const isBelowMin = disposalVolume_volume < pipette.spec.minVolume
  return isBelowMin
    ? belowMinDisposalVolumeWarning(pipette.spec.minVolume)
    : null
}

// both aspirate and dispense air gap volumes have the same minimums
export const _minAirGapVolume = (
  checkboxField: 'aspirate_airGap_checkbox' | 'dispense_airGap_checkbox',
  volumeField: 'aspirate_airGap_volume' | 'dispense_airGap_volume'
) => (fields: HydratedFormData): FormWarning | null => {
  const checkboxValue = fields[checkboxField]
  const volumeValue = fields[volumeField]
  const { pipette } = fields
  if (!checkboxValue || !volumeValue || !pipette || !pipette.spec) return null

  const isBelowMin = Number(volumeValue) < pipette.spec.minVolume
  return isBelowMin ? belowMinAirGapVolumeWarning(pipette.spec.minVolume) : null
}

export const minAspirateAirGapVolume: (
  fields: HydratedFormData
) => FormWarning | null = _minAirGapVolume(
  'aspirate_airGap_checkbox',
  'aspirate_airGap_volume'
)

export const minDispenseAirGapVolume: (
  fields: HydratedFormData
) => FormWarning | null = _minAirGapVolume(
  'dispense_airGap_checkbox',
  'dispense_airGap_volume'
)

/*******************
 **     Helpers    **
 ********************/

type ComposeWarnings = (
  ...warningCheckers: WarningChecker[]
) => (formData: unknown) => FormWarning[]
export const composeWarnings: ComposeWarnings = (
  ...warningCheckers: WarningChecker[]
) => formData =>
  warningCheckers.reduce<FormWarning[]>((acc, checker) => {
    const possibleWarning = checker(formData)
    return possibleWarning ? [...acc, possibleWarning] : acc
  }, [])
