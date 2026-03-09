import { Btn } from '../Btn'
import styles from './newsecondarybtn.module.css'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from '../types'

/**
 * New secondary button variant used in app
 *
 * @component
 */
export const NewSecondaryBtn: FC<ComponentProps<'button'> & StyleProps> = ({
  className,
  ...props
}) => {
  return <Btn {...props} className={styles.new_secondary_btn} />
}
