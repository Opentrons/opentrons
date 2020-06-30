// @flow
import * as React from 'react'
import cx from 'classnames'

import { ToggleField } from '@opentrons/components'

import styles from '../StepEditForm.css'
import type { StepFieldName } from '../../../steplist/fieldLevel'
import { FieldConnector } from './FieldConnector'

type ToggleRowProps = {|
  offLabel?: string,
  onLabel?: string,
  name: StepFieldName,
  className?: string,
  disabled?: boolean,
|}
export const ToggleRowField = (props: ToggleRowProps): React.Node => (
  <FieldConnector
    name={props.name}
    render={({ value, updateValue, disabled }) => (
      <ToggleField
        offLabel={props.offLabel}
        onLabel={props.onLabel}
        disabled={disabled || props.disabled}
        className={cx(styles.toggle_field, props.className)}
        value={!!value}
        onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)}
      />
    )}
  />
)
