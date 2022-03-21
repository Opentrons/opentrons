import * as React from 'react'
import { IconButton } from '@opentrons/components'
import styles from './styles.css'

// import type { IconName } from '@opentrons/components'

export interface IpHostnameItemProps {
  candidate: string
  discovered: boolean
  removeIp: (ip: string) => unknown
}

export class IpHostnameItem extends React.Component<IpHostnameItemProps> {
  remove: () => unknown = () => this.props.removeIp(this.props.candidate)

  render(): JSX.Element {
    // const iconName = this.props.discovered ? 'check' : 'ot-spinner'
    return (
      <div className={styles.ip_item_group}>
        <div className={styles.ip_item}>{this.props.candidate}</div>
        {/* <DiscoveryIcon iconName={iconName} /> */}
        <IconButton
          className={styles.remove_ip_button}
          name="close"
          onClick={this.remove}
        />
      </div>
    )
  }
}

// interface DiscoveryIconProps {
//   iconName: IconName
// }

// function DiscoveryIcon(props: DiscoveryIconProps): JSX.Element {
//   const spin = props.iconName === 'ot-spinner'
//   return (
//     <div className={styles.discovery_icon}>
//       <Icon name={props.iconName} spin={spin} />
//     </div>
//   )
// }
