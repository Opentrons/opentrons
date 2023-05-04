import styles from './styles.css'
import { TitledList } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'

type Props = React.ComponentProps<typeof TitledList>

/** Light wrapper around TitledList for PD-specific styles */
export function PDTitledList(props: Props): JSX.Element {
  return (
    <TitledList
      {...props}
      className={cx(styles.pd_titled_list, props.className)}
    />
  )
}
