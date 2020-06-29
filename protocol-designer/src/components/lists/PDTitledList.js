// @flow
import { TitledList } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'

import styles from './styles.css'

type Props = React.ElementProps<typeof TitledList>

/** Light wrapper around TitledList for PD-specific styles */
export function PDTitledList(props: Props): React.Node {
  return (
    <TitledList
      {...props}
      className={cx(styles.pd_titled_list, props.className)}
    />
  )
}
