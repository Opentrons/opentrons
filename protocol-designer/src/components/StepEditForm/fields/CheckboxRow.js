// @flow
import * as React from 'react'
import {
  CheckboxField,
} from '@opentrons/components'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import styles from '../StepEditForm.css'
import StepField from './StepFormField'

type CheckboxRowProps = {
  label?: string,
  name: StepFieldName,
  children?: ?React.Node,
  className?: string,
  disabled?: boolean,
  tooltipComponent?: React.Node,
}
export const CheckboxRow = (props: CheckboxRowProps) => (
  <StepField
    name={props.name}
    tooltipComponent={props.tooltipComponent}
    render={({value, updateValue, hoverTooltipHandlers}) => (
      <div className={styles.field_row}>
        <CheckboxField
          label={props.label}
          hoverTooltipHandlers={hoverTooltipHandlers}
          disabled={props.disabled}
          className={props.className}
          value={!!value}
          onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)} />
        {value ? props.children : null}
      </div>
    )} />
)

export default CheckboxRow
