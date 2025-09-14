import { withStyleProps } from '../../hocs/withStyleProps'
import { Btn } from '../../primitives'
import styles from './alertprimarybutton.module.css'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from '../../primitives/types'

const AlertPrimaryButtonComponent: FC<
  ComponentProps<'button'> & StyleProps
> = ({ className, ...props }) => {
  const combinedClassName =
    className != null && className !== ''
      ? `${styles.alert_primary_button} ${className}`
      : styles.alert_primary_button

  return <Btn {...props} className={combinedClassName} />
}

export const AlertPrimaryButton: FC<
  ComponentProps<'button'> & StyleProps
> = withStyleProps(AlertPrimaryButtonComponent)
