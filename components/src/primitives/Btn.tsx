import { withStyleProps } from '../hocs/withStyleProps'
import style from './btn.module.css'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from './types'

export const BUTTON_TYPE_SUBMIT: 'submit' = 'submit'
export const BUTTON_TYPE_RESET: 'reset' = 'reset'
export const BUTTON_TYPE_BUTTON: 'button' = 'button'

/**
 * Button primitive
 *
 * @component
 */

const BtnComponent: FC<ComponentProps<'button'> & StyleProps> = ({
  className,
  ...props
}) => {
  const combinedClassName =
    className != null && className !== ''
      ? `${style.btn_container} ${className}`
      : style.btn_container
  return <button {...props} className={combinedClassName} />
}

export const Btn = withStyleProps(BtnComponent) as FC<
  ComponentProps<'button'> & StyleProps
>
