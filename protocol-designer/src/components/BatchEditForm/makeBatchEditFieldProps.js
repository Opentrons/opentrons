// @flow
import type { MultiselectFieldValues } from '../../ui/steps/selectors'
import type { FieldPropsByName } from '../StepEditForm/types'

// TODO(IL, 2021-02-17): this is a placeholder. Actually implement in #7222
export const makeBatchEditFieldProps = (
  fieldValues: MultiselectFieldValues,
  handleChangeFormInput: (name: string, value: mixed) => void
): FieldPropsByName => {
  const junk = {
    isIndeterminate: false,
    disabled: false,
    updateValue: () => {},
    errorToShow: null,
    onFieldBlur: () => {},
    onFieldFocus: () => {},
  }
  return {
    aspirate_mix_checkbox: {
      name: 'aspirate_mix_checkbox',
      value: true,
      ...junk,
    },
    aspirate_mix_volume: {
      name: 'aspirate_mix_volume',
      value: '12',
      isIndeterminate: true,
      ...junk,
    },
    aspirate_mix_times: {
      name: 'aspirate_mix_times',
      value: '',
      ...junk,
    },
  }
}
