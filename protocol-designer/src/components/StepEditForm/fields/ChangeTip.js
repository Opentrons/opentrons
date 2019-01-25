// @flow
import * as React from 'react'
import {FormGroup, DropdownField} from '@opentrons/components'
import i18n from '../../../localization'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import type {ChangeTipOptions} from '../../../step-generation/types'
import type {StepType} from '../../../form-types'
import styles from '../StepEditForm.css'
import StepField from './StepFormField'

const CHANGE_TIP_VALUES: Array<ChangeTipOptions> = ['always', 'once', 'perSource', 'perDest', 'never']

// NOTE: ChangeTipField not validated as of 6/27/18 so no focusHandlers needed
type ChangeTipFieldProps = {name: StepFieldName, stepType: StepType}
const ChangeTipField = (props: ChangeTipFieldProps) => {
  const {name, stepType} = props
  const options = CHANGE_TIP_VALUES.map((value) => ({
    value,
    name: i18n.t(`form.step_edit_form.${stepType}.change_tip_option.${value}`),
  }))
  return (
    <StepField
      name={name}
      render={({value, updateValue, hoverTooltipHandlers}) => (
        <FormGroup
          label={i18n.t('form.step_edit_form.field.change_tip.label')}
          className={styles.large_field}
          hoverTooltipHandlers={hoverTooltipHandlers}>
          <DropdownField
            options={options}
            value={value ? String(value) : null}
            onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.currentTarget.value) } } />
        </FormGroup>
      )} />
  )
}

export default ChangeTipField
