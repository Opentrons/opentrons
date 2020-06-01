// @flow
import * as React from 'react'
import styles from './styles.css'

export type LabwareTableProps = {|
  children: React.Node,
|}

export function LabwareTable(props: LabwareTableProps): React.Node {
  return (
    <table className={styles.labware_table}>
      <tbody>
        <tr>
          <th>Type</th>
          <th>Quantity</th>
        </tr>
        {props.children}
      </tbody>
    </table>
  )
}
