import type { StepFieldName } from '../../form-types'

type DisabledFields = Record<string, string>
const batchEditMoveLiquidPipetteDifferentDisabledFieldNames: StepFieldName[] = [
  // aspirate
  'aspirate_mix_checkbox',
  'aspirate_mix_volume',
  'aspirate_mix_times',
  'aspirate_flowRate',
  'aspirate_airGap_checkbox',
  'aspirate_airGap_volume', // dispense
  'dispense_mix_checkbox',
  'dispense_mix_volume',
  'dispense_mix_times',
  'dispense_airGap_checkbox',
  'dispense_airGap_volume',
  'dispense_flowRate',
]
const batchEditMixPipetteDifferentDisabledFieldNames: StepFieldName[] = [
  'aspirate_flowRate',
  'dispense_flowRate',
]
const batchEditMoveLiquidAspirateLabwareDisabledFieldNames: StepFieldName[] = [
  'aspirate_mmFromBottom',
  'aspirate_delay_checkbox',
  'aspirate_delay_seconds',
  'aspirate_delay_mmFromBottom',
  'aspirate_touchTip_checkbox',
  'aspirate_touchTip_mmFromTop',
]
const batchEditMoveLiquidDispenseLabwareDisabledFieldNames: StepFieldName[] = [
  'dispense_mmFromBottom',
  'dispense_delay_checkbox',
  'dispense_delay_seconds',
  'dispense_delay_mmFromBottom',
  'dispense_touchTip_checkbox',
  'dispense_touchTip_mmFromTop',
]
const batchEditMixLabwareDifferentDisabledFieldNames: StepFieldName[] = [
  'mix_mmFromBottom',
  'aspirate_delay_checkbox',
  'aspirate_delay_seconds',
  'dispense_delay_checkbox',
  'dispense_delay_seconds',
  'mix_touchTip_checkbox',
  'mix_touchTip_mmFromTop',
]
const batchEditMoveLiquidMultiAspiratePathDisabledFieldNames: StepFieldName[] =
  ['aspirate_mix_checkbox', 'aspirate_mix_volume', 'aspirate_mix_times']
const batchEditMoveLiquidMultiDispensePathDisabledFieldNames: StepFieldName[] =
  [
    'dispense_mix_checkbox',
    'dispense_mix_volume',
    'dispense_mix_times',
    'blowout_checkbox',
    'blowout_location',
  ]
const batchEditMoveLiquidPipetteDifferentAndMultiAspiratePathDisabledFieldNames: StepFieldName[] =
  ['aspirate_mix_checkbox', 'aspirate_mix_volume', 'aspirate_mix_times']
const batchEditMoveLiquidPipetteDifferentAndMultiDispensePathDisabledFieldNames: StepFieldName[] =
  ['dispense_mix_checkbox', 'dispense_mix_volume', 'dispense_mix_times']

//  TODO(Jr, 1/16/24): refactor to translate these strings in i18n
const fieldsWithDisabledTooltipText = (
  fieldNames: StepFieldName[],
  disabledReason: string
): DisabledFields => {
  let disabledReasonString = 'Incompatible with current path'
  if (
    disabledReason === 'aspirate_touchTip_checkbox' ||
    disabledReason === 'dispense_touchTip_checkbox'
  ) {
    disabledReasonString = 'Touch tip is not supported'
  } else if (disabledReason === 'blowout_checkbox') {
    disabledReasonString = 'Redundant with disposal volume'
  } else if (disabledReason === 'dispense_mix_checkbox') {
    disabledReasonString = 'Unable to mix in a waste chute or trash bin'
  } else if (disabledReason === 'dispense_mmFromBottom') {
    disabledReasonString = 'Tip position adjustment is not supported'
  }

  return fieldNames.reduce(
    (acc, fieldName: string) => ({
      ...acc,
      [fieldName]: disabledReasonString,
    }),
    {}
  )
}

type BatchEditFormType = 'moveLiquid' | 'mix'
export const getPipetteDifferentDisabledFields = (
  batchEditFormType: BatchEditFormType
): DisabledFields => {
  let disabledFieldNames = []

  switch (batchEditFormType) {
    case 'moveLiquid':
      disabledFieldNames = batchEditMoveLiquidPipetteDifferentDisabledFieldNames
      break

    case 'mix':
      disabledFieldNames = batchEditMixPipetteDifferentDisabledFieldNames
      break
  }

  return fieldsWithDisabledTooltipText(disabledFieldNames, 'pipette-different')
}
export const getLabwareDisabledFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    batchEditMixLabwareDifferentDisabledFieldNames,
    'labware-different'
  )
export const getAspirateLabwareDisabledFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    batchEditMoveLiquidAspirateLabwareDisabledFieldNames,
    'aspirate-labware-different'
  )
export const getDispenseLabwareDisabledFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    batchEditMoveLiquidDispenseLabwareDisabledFieldNames,
    'dispense-labware-different'
  )
export const getMultiAspiratePathDisabledFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    batchEditMoveLiquidMultiAspiratePathDisabledFieldNames,
    'multi-aspirate-present'
  )
export const getMultiDispensePathDisabledFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    batchEditMoveLiquidMultiDispensePathDisabledFieldNames,
    'multi-dispense-present'
  )
export const getPipetteDifferentAndMultiAspiratePathFields =
  (): DisabledFields =>
    fieldsWithDisabledTooltipText(
      batchEditMoveLiquidPipetteDifferentAndMultiAspiratePathDisabledFieldNames,
      'multi-aspirate-present-pipette-different'
    )
export const getPipetteDifferentAndMultiDispensePathFields =
  (): DisabledFields =>
    fieldsWithDisabledTooltipText(
      batchEditMoveLiquidPipetteDifferentAndMultiDispensePathDisabledFieldNames,
      'multi-dispense-present-pipette-different'
    )
