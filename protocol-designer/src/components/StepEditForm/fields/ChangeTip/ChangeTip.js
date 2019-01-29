// @flow
import assert from 'assert'
import * as React from 'react'
import {FormGroup, DropdownField} from '@opentrons/components'
import i18n from '../../../../localization'
import StepField from '../FieldConnector'
import styles from '../../StepEditForm.css'
import type {StepFieldName} from '../../../../steplist/fieldLevel'
import type {StepType} from '../../../../form-types'
import type {ChangeTipOptions} from '../../../../step-generation/types'

// NOTE: ChangeTipField not validated as of 6/27/18 so no focusHandlers needed
type Props = {
  name: StepFieldName,
  options: Array<ChangeTipOptions>,
  disabledOptions: ?Set<ChangeTipOptions>,
  stepType: ?StepType,
}

const ChangeTipField = (props: Props) => {
  const {name, stepType, disabledOptions} = props
  if (!stepType) {
    assert(false, 'ChangeTipField expected stepType prop')
    return null
  }
  const options = props.options.map((value) => ({
    value,
    name: i18n.t(`form.step_edit_form.field.change_tip.option.${value}`),
    disabled: disabledOptions ? disabledOptions.has(value) : false,
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
