import { Btn } from '../Btn'
import styles from './newsecondarybtn.module.css'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from '../types'

/**
 * New secondary button variant used in app
 *
 * @component
 *
 * @deprecated Layout/style primitives are deprecated. If there is a preexisting
 *   higher-level component that does what you want (e.g. from the Helix design system,
 *   or from your project's shared components), use that instead. If not, implement your
 *   own layout+styling with CSS modules and the semantically appropriate native HTML
 *   element (`<li>`, `<menu>`, `<p>`, `<div>`, etc).
 */
export const NewSecondaryBtn: FC<ComponentProps<'button'> & StyleProps> = ({
  className,
  ...props
}) => {
  return <Btn {...props} className={styles.new_secondary_btn} />
}
