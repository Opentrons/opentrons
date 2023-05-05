import { FormData } from '../../../form-types'

export function getDisabledFieldsHeaterShaker(rawForm: FormData): Set<string> {
  const disabled: Set<string> = new Set()

  if (rawForm.setShake === true) {
    disabled.add('latchOpen')
  }

  return disabled
}
