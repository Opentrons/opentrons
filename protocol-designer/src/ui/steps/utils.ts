import { i18n } from '../../localization'
import forEach from 'lodash/forEach'
import { StepFieldName } from '../../form-types'
export const MAIN_CONTENT_FORCED_SCROLL_CLASSNAME = 'main_content_forced_scroll'
// scroll to top of all elements with the special class (probably the main page wrapper)
//
// TODO (ka 2019-10-28): This is a workaround, see #4446
// but it solves the modal positioning problem caused by main page wrapper
// being positioned absolute until we can figure out something better
export const resetScrollElements = (): void => {
  forEach(
    global.document.getElementsByClassName(
      MAIN_CONTENT_FORCED_SCROLL_CLASSNAME
    ),
    elem => {
      elem.scrollTop = 0
    }
  )
}
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
  'aspirate_touchTip_mmFromBottom',
]
const batchEditMoveLiquidDispenseLabwareDisabledFieldNames: StepFieldName[] = [
  'dispense_mmFromBottom',
  'dispense_delay_checkbox',
  'dispense_delay_seconds',
  'dispense_delay_mmFromBottom',
  'dispense_touchTip_checkbox',
  'dispense_touchTip_mmFromBottom',
]
const batchEditMixLabwareDifferentDisabledFieldNames: StepFieldName[] = [
  'mix_mmFromBottom',
  'aspirate_delay_checkbox',
  'aspirate_delay_seconds',
  'dispense_delay_checkbox',
  'dispense_delay_seconds',
  'mix_touchTip_checkbox',
  'mix_touchTip_mmFromBottom',
]
const batchEditMoveLiquidMultiAspiratePathDisabledFieldNames: StepFieldName[] = [
  'aspirate_mix_checkbox',
  'aspirate_mix_volume',
  'aspirate_mix_times',
]
const batchEditMoveLiquidMultiDispensePathDisabledFieldNames: StepFieldName[] = [
  'dispense_mix_checkbox',
  'dispense_mix_volume',
  'dispense_mix_times',
  'blowout_checkbox',
  'blowout_location',
]
const batchEditMoveLiquidPipetteDifferentAndMultiAspiratePathDisabledFieldNames: StepFieldName[] = [
  'aspirate_mix_checkbox',
  'aspirate_mix_volume',
  'aspirate_mix_times',
]
const batchEditMoveLiquidPipetteDifferentAndMultiDispensePathDisabledFieldNames: StepFieldName[] = [
  'dispense_mix_checkbox',
  'dispense_mix_volume',
  'dispense_mix_times',
]

const fieldsWithDisabledTooltipText = (
  fieldNames: StepFieldName[],
  disabledReason: string
): DisabledFields =>
  fieldNames.reduce(
    (acc, fieldName: string) => ({
      ...acc,
      [fieldName]: i18n.t(
        `tooltip.step_fields.batch_edit.disabled.${disabledReason}`
      ),
    }),
    {}
  )

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
export const getPipetteDifferentAndMultiAspiratePathFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    batchEditMoveLiquidPipetteDifferentAndMultiAspiratePathDisabledFieldNames,
    'multi-aspirate-present-pipette-different'
  )
export const getPipetteDifferentAndMultiDispensePathFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    batchEditMoveLiquidPipetteDifferentAndMultiDispensePathDisabledFieldNames,
    'multi-dispense-present-pipette-different'
  )
