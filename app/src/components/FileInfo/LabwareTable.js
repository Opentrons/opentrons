import * as React from 'react'
import styles from './styles.css'
export default function LabwareTable (props) {
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
