// @flow
import { i18n } from '../../localization'
import forEach from 'lodash/forEach'

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

export const getPipetteDisabledFields = (): DisabledFields => ({
  aspirate_flowRate: i18n.t(
    'tooltip.step_fields.batch_edit.aspirate_flowRate.disabled.pipette-different'
  ),
  aspirate_airGap_checkbox: i18n.t(
    'tooltip.step_fields.batch_edit.aspirate_airGap_checkbox.disabled.pipette-different'
  ),
  aspirate_airGap_volume: i18n.t(
    'tooltip.step_fields.batch_edit.aspirate_airGap_volume.disabled.pipette-different'
  ),
  dispense_flowRate: i18n.t(
    'tooltip.step_fields.batch_edit.dispense_flowRate.disabled.pipette-different'
  ),
  dispense_airGap_checkbox: i18n.t(
    'tooltip.step_fields.batch_edit.dispense_airGap_checkbox.disabled.pipette-different'
  ),
  dispense_airGap_volume: i18n.t(
    'tooltip.step_fields.batch_edit.dispense_airGap_volume.disabled.pipette-different'
  ),
})

export const getAspirateLabwareDisabledFields = (): DisabledFields => ({
  aspirate_mmFromBottom: i18n.t(
    'tooltip.step_fields.batch_edit.aspirate_mmFromBottom.disabled.aspirate-labware-different'
  ),
  aspirate_delay_checkbox: i18n.t(
    'tooltip.step_fields.batch_edit.aspirate_delay_checkbox.disabled.aspirate-labware-different'
  ),
  aspirate_delay_seconds: i18n.t(
    'tooltip.step_fields.batch_edit.aspirate_delay_seconds.disabled.aspirate-labware-different'
  ),
  aspirate_delay_mmFromBottom: i18n.t(
    'tooltip.step_fields.batch_edit.aspirate_delay_mmFromBottom.disabled.aspirate-labware-different'
  ),
})

export const getDispenseLabwareDisabledFields = (): DisabledFields => ({
  dispense_mmFromBottom: i18n.t(
    'tooltip.step_fields.batch_edit.dispense_mmFromBottom.disabled.dispense-labware-different'
  ),
  dispense_delay_checkbox: i18n.t(
    'tooltip.step_fields.batch_edit.dispense_delay_checkbox.disabled.dispense-labware-different'
  ),
  dispense_delay_seconds: i18n.t(
    'tooltip.step_fields.batch_edit.dispense_delay_seconds.disabled.dispense-labware-different'
  ),
  dispense_delay_mmFromBottom: i18n.t(
    'tooltip.step_fields.batch_edit.dispense_delay_mmFromBottom.disabled.dispense-labware-different'
  ),
})

export const getMultiAspiratePathDisabledFields = (): DisabledFields => ({
  aspirate_mix_checkbox: i18n.t(
    'tooltip.step_fields.batch_edit.aspirate_mix_checkbox.disabled.multi-aspirate'
  ),
  aspirate_mix_volume: i18n.t(
    'tooltip.step_fields.batch_edit.aspirate_mix_volume.disabled.multi-aspirate'
  ),
  aspirate_mix_times: i18n.t(
    'tooltip.step_fields.batch_edit.aspirate_mix_times.disabled.multi-aspirate'
  ),
})

export const getMultiDispensePathDisabledFields = (): DisabledFields => ({
  dispense_mix_checkbox: i18n.t(
    'tooltip.step_fields.batch_edit.dispense_mix_checkbox.disabled.multi-dispense'
  ),
  dispense_mix_volume: i18n.t(
    'tooltip.step_fields.batch_edit.dispense_mix_volume.disabled.multi-dispense'
  ),
  dispense_mix_times: i18n.t(
    'tooltip.step_fields.batch_edit.dispense_mix_times.disabled.multi-dispense'
  ),
  blowout_checkbox: i18n.t(
    'tooltip.step_fields.batch_edit.blowout_checkbox.disabled.multi-dispense'
  ),
  blowout_location: i18n.t(
    'tooltip.step_fields.batch_edit.blowout_location.disabled.multi-dispense'
  ),
})
