// @flow
import type { IconName } from '@opentrons/components'
import { Icon, IconButton } from '@opentrons/components'
import * as React from 'react'

import styles from './styles.css'

export type IpItemProps = {|
  candidate: string,
  discovered: boolean,
  removeIp: (ip: string) => mixed,
|}

export class IpItem extends React.Component<IpItemProps> {
  remove: () => mixed = () => this.props.removeIp(this.props.candidate)

  render(): React.Node {
    const iconName = this.props.discovered ? 'check' : 'ot-spinner'
    return (
      <div className={styles.ip_item_group}>
        <div className={styles.ip_item}>{this.props.candidate}</div>
        <DiscoveryIcon iconName={iconName} />
        <IconButton
          className={styles.remove_ip_button}
          name="minus"
          onClick={this.remove}
        />
      </div>
    )
  }
}

type DiscoveryIconProps = {|
  iconName: IconName,
|}

function DiscoveryIcon(props: DiscoveryIconProps) {
  const spin = props.iconName === 'ot-spinner'
  return (
    <div className={styles.discovery_icon}>
      <Icon name={props.iconName} spin={spin} />
    </div>
  )
}
