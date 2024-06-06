import type { HydratedFormdata } from '../../../form-types'

export function getDisabledFieldsHeaterShaker(
  hydratedForm: HydratedFormdata
): Set<string> {
  const disabled: Set<string> = new Set()

  if (hydratedForm.setShake === true) {
    disabled.add('latchOpen')
  }

  return disabled
}
