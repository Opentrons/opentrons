import { withStyleProps } from '../../../../components/src/hocs/withStyleProps'
import styles from './submitprimarybutton.module.css'

import type { ComponentProps, FC } from 'react'
import type { StyleProps } from '@opentrons/components'

const BaseSubmitInput: FC<ComponentProps<'input'> & StyleProps> = ({
  className,
  ...props
}) => {
  const combinedClassName =
    className != null && className !== ''
      ? `${styles.submitButton} ${className}`
      : styles.submitButton

  return <input {...props} type="submit" className={combinedClassName} />
}

export const SubmitPrimaryButton: FC<
  ComponentProps<'input'> & StyleProps
> = withStyleProps(BaseSubmitInput)
