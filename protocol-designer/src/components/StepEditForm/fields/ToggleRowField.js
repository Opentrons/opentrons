// @flow
import * as React from 'react'
import cx from 'classnames'

import { ToggleField } from '@opentrons/components'

import styles from '../StepEditForm.css'

import type { FieldProps } from '../types'

type ToggleRowProps = {|
  ...FieldProps,
  offLabel?: string,
  onLabel?: string,
  className?: string,
|}
export const ToggleRowField = (props: ToggleRowProps): React.Node => {
  const { updateValue, value, name, offLabel, onLabel, className } = props
  return (
    <ToggleField
      name={name}
      offLabel={offLabel}
      onLabel={onLabel}
      className={cx(styles.toggle_field, className)}
      value={Boolean(value)}
      onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)}
    />
  )
}
