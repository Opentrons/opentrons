// @flow
import * as React from 'react'
import cx from 'classnames'
import { TitledList } from '@opentrons/components'
import styles from './styles.css'

type Props = React.ElementProps<typeof TitledList>

/** Light wrapper around TitledList for PD-specific styles */
export function PDTitledList(props: Props) {
  return (
    <TitledList
      {...props}
      className={cx(styles.pd_titled_list, props.className)}
    />
  )
}
