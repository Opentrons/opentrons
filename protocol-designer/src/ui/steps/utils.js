// @flow
import { i18n } from '../../localization'
import forEach from 'lodash/forEach'
import type { MultiSelectFieldName } from '../../form-types'
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

const pipetteDifferentDisabledFieldNames: Array<MultiSelectFieldName> = [
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

const aspirateLabwareDisabledFieldNames: Array<MultiSelectFieldName> = [
  'aspirate_mmFromBottom',
  'aspirate_delay_checkbox',
  'aspirate_delay_seconds',
  'aspirate_delay_mmFromBottom',
  'aspirate_touchTip_checkbox',
  'aspirate_touchTip_mmFromBottom'
]

const dispenseLabwareDisabledFieldNames: Array<MultiSelectFieldName> = [
  'dispense_mmFromBottom',
  'dispense_delay_checkbox',
  'dispense_delay_seconds',
  'dispense_delay_mmFromBottom',
  'dispense_touchTip_checkbox',
  'dispense_touchTip_mmFromBottom'
]

const multiAspiratePathDisabledFieldNames: Array<MultiSelectFieldName> = [
  'aspirate_mix_checkbox',
  'aspirate_mix_volume',
  'aspirate_mix_times',
]

const multiDispensePathDisabledFieldNames: Array<MultiSelectFieldName> = [
  'dispense_mix_checkbox',
  'dispense_mix_volume',
  'dispense_mix_times',
  'blowout_checkbox',
  'blowout_location',
]

const pipetteDifferentAndMultiAspiratePathDisabledFieldNames: Array<MultiSelectFieldName> = [
  'aspirate_mix_checkbox',
  'aspirate_mix_volume',
  'aspirate_mix_times',
]

const pipetteDifferentAndMultiDispensePathDisabledFieldNames: Array<MultiSelectFieldName> = [
  'dispense_mix_checkbox',
  'dispense_mix_volume',
  'dispense_mix_times',
]

const fieldsWithDisabledTooltipText = (
  fieldNames: Array<MultiSelectFieldName>,
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
export const getPipetteDifferentDisabledFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    pipetteDifferentDisabledFieldNames,
    'pipette-different'
  )

export const getAspirateLabwareDisabledFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    aspirateLabwareDisabledFieldNames,
    'aspirate-labware-different'
  )

export const getDispenseLabwareDisabledFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    dispenseLabwareDisabledFieldNames,
    'dispense-labware-different'
  )

export const getMultiAspiratePathDisabledFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    multiAspiratePathDisabledFieldNames,
    'multi-aspirate-present'
  )

export const getMultiDispensePathDisabledFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    multiDispensePathDisabledFieldNames,
    'multi-dispense-present'
  )

export const getPipetteDifferentAndMultiAspiratePathFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    pipetteDifferentAndMultiAspiratePathDisabledFieldNames,
    'multi-aspirate-present-pipette-different'
  )

export const getPipetteDifferentAndMultiDispensePathFields = (): DisabledFields =>
  fieldsWithDisabledTooltipText(
    pipetteDifferentAndMultiDispensePathDisabledFieldNames,
    'multi-dispense-present-pipette-different'
  )
