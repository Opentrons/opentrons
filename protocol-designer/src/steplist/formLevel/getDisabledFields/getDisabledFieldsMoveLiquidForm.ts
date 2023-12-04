import type { HydratedFormdata } from '../../../form-types'
// NOTE: expects that '_checkbox' fields are implemented so that
// when checkbox is disabled, its dependent fields are hidden
export function getDisabledFieldsMoveLiquidForm(
  hydratedForm: HydratedFormdata
): Set<string> {
  const disabled: Set<string> = new Set()
  const prefixes = ['aspirate', 'dispense']

  if (
    hydratedForm.dispense_labware?.name === 'wasteChute' ||
    hydratedForm.dispense_labware?.name === 'trashBin'
  ) {
    disabled.add('dispense_mix_checkbox')
    disabled.add('dispense_touchTip_checkbox')
    disabled.add('dispense_mmFromBottom')
  }
  if (hydratedForm.path === 'multiAspirate') {
    disabled.add('aspirate_mix_checkbox')
  } else if (hydratedForm.path === 'multiDispense') {
    disabled.add('dispense_mix_checkbox')
    if (hydratedForm.disposalVolume_checkbox) {
      disabled.add('blowout_checkbox')
    }
  }
  if (!hydratedForm.dispense_labware?.isTouchTipAllowed) {
    disabled.add('dispense_touchTip_checkbox')
  }
  if (!hydratedForm.aspirate_labware?.isTouchTipAllowed) {
    disabled.add('aspirate_touchTip_checkbox')
  }
  // fields which require a pipette & a corresponding labware to be selected
  prefixes.forEach(prefix => {
    if (!hydratedForm.pipette || !hydratedForm[prefix + '_labware']) {
      disabled.add(prefix + '_touchTip_checkbox')
      disabled.add(prefix + '_mmFromBottom')
      disabled.add(prefix + '_wells')
    }
  })
  return disabled
}
