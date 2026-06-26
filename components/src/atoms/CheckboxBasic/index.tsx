import clsx from 'clsx'

import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import styles from './checkboxbasic.module.css'

import type { ChangeEventHandler } from 'react'

export interface CheckboxBasicProps {
  /** false = unchecked, true = checked, 'indeterminate' = partial-select dash */
  checked: boolean | 'indeterminate'
  onChange: ChangeEventHandler<HTMLInputElement>
  disabled?: boolean
  /** Use "On Color" Figma variant — border/mark colors flip to white/blue for use on colored backgrounds */
  onColor?: boolean
  /**
   * When unchecked: fills the checkbox box background.
   * When checked: fills the checkmark (shows through the ot-checkbox transparent hole).
   * When indeterminate: fills the dash mark.
   */
  backgroundColor?: string
  tabIndex?: number
}

export function CheckboxBasic(props: CheckboxBasicProps): JSX.Element {
  const {
    checked,
    onChange,
    disabled = false,
    onColor = false,
    backgroundColor,
    tabIndex = 0,
  } = props

  const isChecked = checked === true
  const isIndeterminate = checked === 'indeterminate'
  const isActive = isChecked || isIndeterminate

  // ot-checkbox SVG fill IS the box color; transparent checkmark hole reveals the div background.
  const iconColor = onColor
    ? COLORS.white
    : disabled
      ? COLORS.grey30
      : COLORS.blue50

  // For unselected and checked: backgroundColor goes on the box div.
  // For checked, it shows through the transparent ot-checkbox hole → becomes the checkmark color.
  // For indeterminate: backgroundColor is the dash color; box bg stays from CSS.
  const boxStyle =
    backgroundColor != null && !isIndeterminate
      ? { backgroundColor }
      : undefined
  const dashStyle = backgroundColor != null ? { backgroundColor } : undefined

  return (
    <label className={clsx(styles.root, { [styles.root_disabled]: disabled })}>
      <input
        type="checkbox"
        className={styles.input}
        checked={isChecked}
        onChange={onChange}
        disabled={disabled}
        tabIndex={tabIndex}
      />
      <div
        className={clsx(styles.box, {
          // Unselected
          [styles.box_unselected]: !isActive && !onColor && !disabled,
          [styles.box_unselected_disabled]: !isActive && !onColor && disabled,
          [styles.box_on_color_unselected]: !isActive && onColor && !disabled,
          [styles.box_on_color_unselected_disabled]:
            !isActive && onColor && disabled,
          // Selected (ot-checkbox; no background — icon fill is the box color)
          [styles.box_selected]: isChecked && !onColor && !disabled,
          [styles.box_selected_disabled]: isChecked && !onColor && disabled,
          // On Color selected (background shows through the transparent checkmark hole = blue mark)
          [styles.box_on_color_selected]: isChecked && onColor && !disabled,
          [styles.box_on_color_selected_disabled]:
            isChecked && onColor && disabled,
          // Indeterminate (box needs explicit background color behind the dash)
          [styles.box_indeterminate]: isIndeterminate && !onColor && !disabled,
          [styles.box_indeterminate_disabled]:
            isIndeterminate && !onColor && disabled,
          [styles.box_on_color_indeterminate]:
            isIndeterminate && onColor && !disabled,
          [styles.box_on_color_indeterminate_disabled]:
            isIndeterminate && onColor && disabled,
        })}
        style={boxStyle}
      >
        {isChecked && <Icon name="ot-checkbox" color={iconColor} />}
        {isIndeterminate && (
          <div
            className={clsx(styles.dash, {
              [styles.dash_on_color]: onColor,
              [styles.dash_disabled]: !onColor && disabled,
            })}
            style={dashStyle}
          />
        )}
      </div>
    </label>
  )
}
