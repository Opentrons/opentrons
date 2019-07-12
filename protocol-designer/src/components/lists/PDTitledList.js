// @flow
import * as React from 'react'
import cx from 'classnames'
import { TitledList } from '@opentrons/components'
import styles from './styles.css'

type Props = React.ElementProps<typeof TitledList>

/** Light wrapper around TitledList for PD-specific styles */
export default function PDTitledList(props: Props) {
  return (
    <TitledList
      {...props}
      titleBarClass={styles.pd_titled_list_title}
      className={cx(styles.pd_titled_list, props.className)}
    />
  )
}
