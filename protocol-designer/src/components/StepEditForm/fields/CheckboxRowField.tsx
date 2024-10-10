import type * as React from 'react'
import {
  DeprecatedCheckboxField,
  useHoverTooltip,
  LegacyTooltip,
  TOOLTIP_TOP,
} from '@opentrons/components'
import cx from 'classnames'
import styles from '../StepEditForm.module.css'
import type { FieldProps } from '../types'
import type { Placement } from '@opentrons/components'

type CheckboxRowProps = FieldProps & {
  children?: React.ReactNode
  className?: string
  label?: string
  tooltipContent?: React.ReactNode
  tooltipPlacement?: Placement
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
    tooltipPlacement = TOOLTIP_TOP,
  } = props

  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: tooltipPlacement,
  })
  return (
    <>
      {tooltipContent && (
        <LegacyTooltip lineHeight="1.5" {...tooltipProps}>
          {tooltipContent}
        </LegacyTooltip>
      )}
      <div className={styles.checkbox_row}>
        <DeprecatedCheckboxField
          className={cx(styles.checkbox_field, className)}
          disabled={disabled}
          isIndeterminate={isIndeterminate}
          label={label}
          labelProps={targetProps}
          name={name}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            updateValue(!value)
          }}
          value={disabled ? false : Boolean(value)}
        />
        {value && !disabled && !isIndeterminate ? children : null}
      </div>
    </>
  )
}
