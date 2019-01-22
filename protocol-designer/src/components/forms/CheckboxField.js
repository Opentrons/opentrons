// @flow
import * as React from 'react'
import cx from 'classnames'

import {CheckboxField as SharedCheckboxField} from '@opentrons/components'
import styles from './forms.css'

type Props = {
  ...React.ElementProps<typeof SharedCheckboxField>,
  className: string,
}

const CheckboxField = ({className, ...props}: Props) => (
  <SharedCheckboxField
    {...props}
    className={cx(styles.checkbox_field, className)} />
)

export default CheckboxField
