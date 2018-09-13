// @flow
import * as React from 'react'
import styles from './styles.css'

type Props = {
  title: string,
  children: React.Node,
}

export default function LabwareTable (props: Props) {
  return (
    <div>
    <h3 className={styles.title}>{props.title}</h3>
    <table className={styles.labware_table}>
      <tbody>
        <tr>
          <th>Type</th>
          <th>Quantity</th>
        </tr>
        {props.children}
      </tbody>
    </table>
    </div>
  )
}
