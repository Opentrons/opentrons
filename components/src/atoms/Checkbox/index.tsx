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
  /** checkbox is checked if value is true */
  isChecked: boolean
  /** label text that describes the option */
  labelText: string
  /** callback change handler */
  onChange: ChangeEventHandler<HTMLInputElement>
  /** html tabindex property */
  tabIndex?: number
  /** if disabled is true, mouse events will not trigger onClick callback */
  disabled?: boolean
  /** optional borderRadius type */
  type?: 'round' | 'neutral'
  /** optional width for helix */
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
    <Btn
      display={DISPLAY_FLEX}
      alignItems={ALIGN_CENTER}
      role="checkbox"
      aria-checked={isChecked}
      onClick={onClick}
      tabIndex={tabIndex}
      disabled={disabled}
      css={CHECKBOX_STYLE}
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
