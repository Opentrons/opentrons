import * as React from 'react'
import styles from './styles.css'
import * as app_settings from '../../assets/localization/en/app_settings.json'
import { IconButton, COLORS, Text, TYPOGRAPHY } from '@opentrons/components'

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
        <Text
          fontSize={TYPOGRAPHY.fontSizeH6}
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          lineHeight={TYPOGRAPHY.lineHeight12}
          textTransform={TYPOGRAPHY.textTransformNone}
          fontStyle={TYPOGRAPHY.fontStyleNormal}
          color={COLORS.darkGreyEnabled}
          css={`
            white-space: nowrap;
          `}
        >
          {this.props.discovered
            ? app_settings.ip_available
            : app_settings.ip_not_found}
        </Text>
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
