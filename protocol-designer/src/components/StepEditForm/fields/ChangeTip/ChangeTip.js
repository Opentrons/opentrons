// @flow
import assert from 'assert'
import * as React from 'react'
import {FormGroup, HoverTooltip, SelectField} from '@opentrons/components'
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
  const options = props.options.map((value) => {
    const toolTip = i18n.t(`form.step_edit_form.field.change_tip.option_tooltip.${value}`)
    const option = i18n.t(`form.step_edit_form.field.change_tip.option.${value}`)
    const label = (
      <HoverTooltip tooltipComponent={toolTip} positionFixed placement='top'>
        {(hoverTooltipHandlers) => <div {...hoverTooltipHandlers}>{option}</div>}
      </HoverTooltip>
    )
    return {
      value,
      label,
      isDisabled: disabledOptions ? disabledOptions.has(value) : false,
    }
  })
  return (
    <StepField
      name={name}
      render={({value, updateValue, hoverTooltipHandlers}) => (
        <FormGroup
          label={i18n.t('form.step_edit_form.field.change_tip.label')}
          className={styles.large_field}
          hoverTooltipHandlers={hoverTooltipHandlers}>
          <SelectField
            name={name}
            options={options}
            value={value ? String(value) : null}
            onValueChange={(name, value) => updateValue(value)} />
        </FormGroup>
      )} />
  )
}

export default ChangeTipField
