// @flow
import { CheckboxField } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'

import type { StepFieldName } from '../../../steplist/fieldLevel'
import styles from '../StepEditForm.css'
import { FieldConnector } from './FieldConnector'

type CheckboxRowProps = {
  label?: string,
  name: StepFieldName,
  children?: ?React.Node,
  className?: string,
  disabled?: boolean,
  tooltipComponent?: React.Node,
}
export const CheckboxRowField = (props: CheckboxRowProps): React.Node => (
  <FieldConnector
    name={props.name}
    tooltipComponent={props.tooltipComponent}
    render={({ value, updateValue, hoverTooltipHandlers, disabled }) => (
      <div className={styles.checkbox_row}>
        <CheckboxField
          label={props.label}
          hoverTooltipHandlers={hoverTooltipHandlers}
          disabled={disabled || props.disabled}
          className={cx(styles.checkbox_field, props.className)}
          value={!!value}
          onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)}
        />
        {value && !disabled ? props.children : null}
      </div>
    )}
  />
)
