// @flow
import * as React from 'react'
import cx from 'classnames'

import {DropdownField as SharedDropdownField} from '@opentrons/components'
import styles from './forms.css'

type Props = {
  ...React.ElementProps<typeof SharedDropdownField>,
  className: string,
}

const DropdownField = ({className, ...props}: Props) => (
  <SharedDropdownField
    {...props}
    className={cx(styles.dropdown_field, className)} />
)

export default DropdownField
