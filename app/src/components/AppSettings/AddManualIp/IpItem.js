// @flow
import * as React from 'react'
import {IconButton} from '@opentrons/components'
import styles from './styles.css'
type Props = {
  candidate: string,
  removeIp: (ip: string) => mixed,
}
export default class IpItem extends React.Component<Props> {
  remove = () => this.props.removeIp(this.props.candidate)
  render () {
    return (
      <div className={styles.ip_field_group}>
        <div className={styles.ip_item}>{this.props.candidate}</div>
        <IconButton
          className={styles.ip_button}
          name="minus"
          onClick={this.remove}
        />
      </div>
    )
  }
}
