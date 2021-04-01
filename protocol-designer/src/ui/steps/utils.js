// @flow
import { i18n } from '../../localization'
import forEach from 'lodash/forEach'
import type { StepFieldName } from '../../form-types'
export const MAIN_CONTENT_FORCED_SCROLL_CLASSNAME = 'main_content_forced_scroll'

// scroll to top of all elements with the special class (probably the main page wrapper)
//
// TODO (ka 2019-10-28): This is a workaround, see #4446
// but it solves the modal positioning problem caused by main page wrapper
// being positioned absolute until we can figure out something better
export const resetScrollElements = () => {
  forEach(
    global.document.getElementsByClassName(
      MAIN_CONTENT_FORCED_SCROLL_CLASSNAME
    ),
    elem => {
      elem.scrollTop = 0
    }
  )
}

type DisabledFields = {
  [fieldName: string]: string,
}

const batchEditMoveLiquidPipetteDifferentDisabledFieldNames: Array<StepFieldName> = [
  // aspirate
  'aspirate_mix_checkbox',
  'aspirate_mix_volume',
  'aspirate_mix_times',
  'aspirate_flowRate',
  'aspirate_airGap_checkbox',
  'aspirate_airGap_volume',
  // dispense
  'dispense_mix_checkbox',
  'dispense_mix_volume',
  'dispense_mix_times',
  'dispense_airGap_checkbox',
  'dispense_airGap_volume',
  'dispense_flowRate',
]

const batchEditMixPipetteDifferentDisabledFieldNames: Array<StepFieldName> = [
  'aspirate_flowRate',
  'dispense_flowRate',
]

const batchEditMoveLiquidAspirateLabwareDisabledFieldNames: Array<StepFieldName> = [
  'aspirate_mmFromBottom',
  'aspirate_delay_checkbox',
  'aspirate_delay_seconds',
  'aspirate_delay_mmFromBottom',
  'aspirate_touchTip_checkbox',
  'aspirate_touchTip_mmFromBottom',
]

const batchEditMoveLiquidDispenseLabwareDisabledFieldNames: Array<StepFieldName> = [
  'dispense_mmFromBottom',
  'dispense_delay_checkbox',
  'dispense_delay_seconds',
  'dispense_delay_mmFromBottom',
  'dispense_touchTip_checkbox',
  'dispense_touchTip_mmFromBottom',
]

const batchEditMoveLiquidMultiAspiratePathDisabledFieldNames: Array<StepFieldName> = [
  'aspirate_mix_checkbox',
  'aspirate_mix_volume',
  'aspirate_mix_times',
]

const batchEditMoveLiquidMultiDispensePathDisabledFieldNames: Array<StepFieldName> = [
  'dispense_mix_checkbox',
  'dispense_mix_volume',
  'dispense_mix_times',
  'blowout_checkbox',
  'blowout_location',
]

const batchEditMoveLiquidPipetteDifferentAndMultiAspiratePathDisabledFieldNames: Array<StepFieldName> = [
  'aspirate_mix_checkbox',
  'aspirate_mix_volume',
  'aspirate_mix_times',
]

const batchEditMoveLiquidPipetteDifferentAndMultiDispensePathDisabledFieldNames: Array<StepFieldName> = [
  'dispense_mix_checkbox',
  'dispense_mix_volume',
  'dispense_mix_times',
]

const fieldsWithDisabledTooltipText = (
  fieldNames: Array<StepFieldName>,
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

// add more form types here as batch edit mode expands to new forms
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

export const getAspirateLabwareDisabledFields = (
  batchEditFormType: BatchEditFormType
): DisabledFields => {
  let disabledFieldNames = []
  switch (batchEditFormType) {
    case 'moveLiquid':
      disabledFieldNames = batchEditMoveLiquidAspirateLabwareDisabledFieldNames
      break
    case 'mix':
      // disabledFieldNames = batchEditMixAspirateLabwareDisabledFieldNames
      break
  }
  return fieldsWithDisabledTooltipText(
    disabledFieldNames,
    'aspirate-labware-different'
  )
}

export const getDispenseLabwareDisabledFields = (
  batchEditFormType: BatchEditFormType
): DisabledFields => {
  let disabledFieldNames = []
  switch (batchEditFormType) {
    case 'moveLiquid':
      disabledFieldNames = batchEditMoveLiquidDispenseLabwareDisabledFieldNames
      break
    case 'mix':
      // disabledFieldNames = batchEditMIXDispenseLabwareDisabledFieldNames
      break
  }
  return fieldsWithDisabledTooltipText(
    disabledFieldNames,
    'dispense-labware-different'
  )
}

export const getMultiAspiratePathDisabledFields = (
  batchEditFormType: BatchEditFormType
): DisabledFields => {
  let disabledFieldNames = []
  switch (batchEditFormType) {
    case 'moveLiquid':
      disabledFieldNames = batchEditMoveLiquidMultiAspiratePathDisabledFieldNames
      break
    case 'mix':
      // path not relevant in mix steps
      break
  }
  return fieldsWithDisabledTooltipText(
    disabledFieldNames,
    'multi-aspirate-present'
  )
}

export const getMultiDispensePathDisabledFields = (
  batchEditFormType: BatchEditFormType
): DisabledFields => {
  let disabledFieldNames = []
  switch (batchEditFormType) {
    case 'moveLiquid':
      disabledFieldNames = batchEditMoveLiquidMultiDispensePathDisabledFieldNames
      break
    case 'mix':
      // path not relevant in mix steps
      break
  }
  return fieldsWithDisabledTooltipText(
    disabledFieldNames,
    'multi-dispense-present'
  )
}

export const getPipetteDifferentAndMultiAspiratePathFields = (
  batchEditFormType: BatchEditFormType
): DisabledFields => {
  let disabledFieldNames = []
  switch (batchEditFormType) {
    case 'moveLiquid':
      disabledFieldNames = batchEditMoveLiquidPipetteDifferentAndMultiAspiratePathDisabledFieldNames
      break
    case 'mix':
      // path not relevant in mix steps
      break
  }
  return fieldsWithDisabledTooltipText(
    disabledFieldNames,
    'multi-aspirate-present-pipette-different'
  )
}

export const getPipetteDifferentAndMultiDispensePathFields = (
  batchEditFormType: BatchEditFormType
): DisabledFields => {
  let disabledFieldNames = []
  switch (batchEditFormType) {
    case 'moveLiquid':
      disabledFieldNames = batchEditMoveLiquidPipetteDifferentAndMultiDispensePathDisabledFieldNames
      break
    case 'mix':
      // path not relevant in mix steps
      break
  }
  return fieldsWithDisabledTooltipText(
    disabledFieldNames,
    'multi-dispense-present-pipette-different'
  )
}
