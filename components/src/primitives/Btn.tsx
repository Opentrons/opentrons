import { forwardRef } from 'react'

import { withStyleProps } from '../hocs/withStyleProps'
import style from './btn.module.css'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from './types'

export const BUTTON_TYPE_SUBMIT: 'submit' = 'submit'
export const BUTTON_TYPE_RESET: 'reset' = 'reset'
export const BUTTON_TYPE_BUTTON: 'button' = 'button'

const BtnComponent = forwardRef<
  HTMLButtonElement,
  ComponentProps<'button'> & StyleProps
>(({ className, ...props }, ref) => {
  const combinedClassName =
    className != null && className !== ''
      ? `${style.btn_container} ${className}`
      : style.btn_container
  return <button {...props} ref={ref} className={combinedClassName} />
})

BtnComponent.displayName = 'BtnComponent'

/**
 * Button primitive
 *
 * @component
 *
 * @deprecated Layout/style primitives are deprecated. If there is a preexisting
 *   higher-level component that does what you want (e.g. from the Helix design system,
 *   or from your project's shared components), use that instead. If not, implement your
 *   own layout+styling with CSS modules and the semantically appropriate native HTML
 *   element (`<li>`, `<menu>`, `<p>`, `<div>`, etc).
 */
export const Btn: FC<ComponentProps<'button'> & StyleProps> = withStyleProps(
  BtnComponent
) as FC<ComponentProps<'button'> & StyleProps>
