import clsx from 'clsx'

import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { FLEX_MAX_CONTENT } from '../../styles'
import { StyledText } from '../StyledText'
import styles from './checkbox.module.css'

import type { ChangeEventHandler, CSSProperties } from 'react'

type CheckboxStyle = CSSProperties & {
  '--checkbox-width'?: string
}

export interface CheckboxProps {
  isChecked: boolean
  labelText: string
  onChange: ChangeEventHandler<HTMLInputElement>
  tabIndex?: number
  disabled?: boolean
  type?: 'round' | 'neutral'
  width?: string
}

export function Checkbox(props: CheckboxProps): JSX.Element {
  const {
    isChecked,
    labelText,
    onChange,
    tabIndex = 0,
    disabled = false,
    width = FLEX_MAX_CONTENT,
    type = 'round',
  } = props

  const checkboxStyle: CheckboxStyle = {
    '--checkbox-width': width,
  }

  return (
    <label
      className={clsx(styles.chckbox_label, {
        [styles.checkbox_label_checked]: isChecked,
        [styles.checkbox_label_unchecked]: !isChecked,
        [styles.checkbox_label_round]: type === 'round',
        [styles.checkbox_label_neutral]: type !== 'round',
        [styles.checkbox_label_disabled]: disabled,
        [styles.checkbox_label_enabled]: !disabled,
      })}
      // eslint-disable-next-line react/forbid-dom-props -- width is a runtime prop and cannot be represented with static classes.
      style={checkboxStyle}
    >
      <input
        type="checkbox"
        className={styles.checkbox_input_hidden}
        checked={isChecked}
        onChange={onChange}
        disabled={disabled}
        tabIndex={tabIndex}
      />
      <StyledText desktopStyle="bodyDefaultRegular" oddStyle="bodyTextSemiBold">
        {labelText}
      </StyledText>
      <Check isChecked={isChecked} disabled={disabled} />
    </label>
  )
}

interface CheckProps {
  isChecked: boolean
  color?: string
  disabled?: boolean
}

export function Check(props: CheckProps): JSX.Element {
  const { isChecked, color = COLORS.white, disabled = false } = props

  return isChecked ? (
    <div className={styles.checkbox_wrapper}>
      <Icon name="ot-checkbox" color={color} />
    </div>
  ) : (
    <div
      className={clsx(
        styles.checkbox_wrapper,
        styles.checkbox_wrapper_unchecked,
        {
          [styles.checkbox_wrapper_unchecked_disabled]: disabled,
        }
      )}
    />
  )
}
