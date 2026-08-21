import { withStyleProps } from '../../../hocs/withStyleProps'
import { Btn } from '../../../primitives'
import styles from './altprimarybutton.module.css'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from '../../../primitives/types'

const AltPrimaryButtonComponent: FC<ComponentProps<'button'> & StyleProps> = ({
  className,
  ...props
}) => {
  const combinedClassName =
    className != null && className !== ''
      ? `${styles.alt_primary_button} ${className}`
      : styles.alt_primary_button

  return <Btn {...props} className={combinedClassName} />
}

export const AltPrimaryButton: FC<ComponentProps<'button'> & StyleProps> =
  withStyleProps(AltPrimaryButtonComponent)
