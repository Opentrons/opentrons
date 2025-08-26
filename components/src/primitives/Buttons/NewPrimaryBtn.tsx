import { Btn } from '../Btn'
import styles from './newprimarybtn.module.css'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from '../types'

/**
 * New primary button variant used in app
 *
 * @component
 */
export const NewPrimaryBtn: FC<ComponentProps<'button'> & StyleProps> = ({
  className,
  ...props
}) => {
  return <Btn {...props} className={styles.new_primary_btn} />
}
