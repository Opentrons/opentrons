// @flow
import * as React from 'react'
import styles from './styles.css'

export type ProtocolLabwareListProps = {|
  children: React.Node,
|}

export function ProtocolLabwareList(
  props: ProtocolLabwareListProps
): React.Node {
  return (
    <div className={styles.labware_table}>
      <tbody>
        <tr>
          <th>Type</th>
          <th>Quantity</th>
        </tr>
        {props.children}
      </tbody>
    </div>
  )
}
