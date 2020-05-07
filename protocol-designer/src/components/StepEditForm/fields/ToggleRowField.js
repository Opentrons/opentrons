// @flow
import * as React from 'react'
import { ToggleField } from '@opentrons/components'
import cx from 'classnames'

import type { StepFieldName } from '../../../steplist/fieldLevel'
import styles from '../StepEditForm.css'
import { FieldConnector } from './FieldConnector'

type ToggleRowProps = {
  labelOff?: string,
  labelOn?: string,
  name: StepFieldName,
  className?: string,
  disabled?: boolean,
}
export const ToggleRowField = (props: ToggleRowProps) => (
  <FieldConnector
    name={props.name}
    render={({ value, updateValue, disabled }) => (
      <ToggleField
        labelOff={props.labelOff}
        labelOn={props.labelOn}
        disabled={disabled || props.disabled}
        className={cx(styles.toggle_field, props.className)}
        value={!!value}
        onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)}
      />
    )}
  />
)
