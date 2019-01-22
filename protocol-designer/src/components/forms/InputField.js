// @flow
import * as React from 'react'
import cx from 'classnames'

import {InputField as SharedInputField} from '@opentrons/components'
import styles from './forms.css'

type Props = {
  ...React.ElementProps<typeof SharedInputField>,
  className: string,
}

const InputField = ({className, ...props}: Props) => (
  <SharedInputField
    {...props}
    className={cx(styles.input_field, className)} />
)

export default InputField
