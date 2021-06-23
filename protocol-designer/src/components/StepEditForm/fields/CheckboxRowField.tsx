import * as React from 'react'
import {
  CheckboxField,
  useHoverTooltip,
  Tooltip,
  TOOLTIP_TOP,
} from '@opentrons/components'
import cx from 'classnames'
import styles from '../StepEditForm.css'
import { FieldProps } from '../types'

type CheckboxRowProps = FieldProps & {
  children?: React.ReactNode
  className?: string
  label?: string
  tooltipContent?: React.ReactNode
}

export const CheckboxRowField = (props: CheckboxRowProps): JSX.Element => {
  const {
    children,
    className,
    disabled,
    isIndeterminate,
    label,
    name,
    tooltipContent,
    updateValue,
    value,
  } = props

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
  })

  return (
    <>
      <Tooltip maxWidth="18rem" lineHeight="1.5" {...tooltipProps}>
        {tooltipContent}
      </Tooltip>
      <div className={styles.checkbox_row}>
        <CheckboxField
          className={cx(styles.checkbox_field, className)}
          disabled={disabled}
          isIndeterminate={isIndeterminate}
          label={label}
          labelProps={targetProps}
          name={name}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            updateValue(!value)
          }
          value={Boolean(value)}
        />
        {value && !disabled && !isIndeterminate ? children : null}
      </div>
    </>
  )
}
