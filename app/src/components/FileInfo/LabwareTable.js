// @flow
import * as React from 'react'
import styles from './styles.css'

type Props = {
  children: React.Node,
}

export default function LabwareTable (props: Props) {
  return (
    <table className={styles.labware_table}>
      <tbody>
        <tr>
          <th>Name</th>
          <th>Quantity</th>
        </tr>
        {props.children}
      </tbody>
    </table>
  )
}
