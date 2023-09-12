import { PipetteEntities } from '@opentrons/step-generation'
import { FormData } from '../../../form-types'
// NOTE: expects that '_checkbox' fields are implemented so that
// when checkbox is disabled, its dependent fields are hidden
export function getDisabledFieldsMoveLiquidForm(
  rawForm: FormData, // TODO IMMEDIATELY use raw form type instead of FormData
  pipetteEntities: PipetteEntities
): Set<string> {
  const disabled: Set<string> = new Set()
  const prefixes = ['aspirate', 'dispense']
  const pipetteSelected =
    rawForm.pipette != null
      ? pipetteEntities[String(rawForm.pipette)].name
      : null
  const pushOutAllowed =
    Number(rawForm.volume) <= 1 &&
    (pipetteSelected === 'p50_single_flex' ||
      pipetteSelected === 'p50_multi_flex')

  if (rawForm.path === 'multiAspirate') {
    disabled.add('aspirate_mix_checkbox')
  } else if (rawForm.path === 'multiDispense') {
    disabled.add('dispense_mix_checkbox')

    if (rawForm.disposalVolume_checkbox) {
      disabled.add('blowout_checkbox')
    }
  }

  // fields which require a pipette & a corresponding labware to be selected
  prefixes.forEach(prefix => {
    if (!rawForm.pipette || !rawForm[prefix + '_labware']) {
      disabled.add(prefix + '_touchTip_checkbox')
      disabled.add(prefix + '_mmFromBottom')
      disabled.add(prefix + '_wells')
    }
  })

  if (!pushOutAllowed) {
    disabled.add('dispense_pushOut')
  }
  return disabled
}
