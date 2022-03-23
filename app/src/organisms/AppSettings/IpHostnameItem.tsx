import * as React from 'react'
import * as app_settings from '../../assets/localization/en/app_settings.json'
import {
  IconButton,
  COLORS,
  Text,
  TYPOGRAPHY,
  Flex,
  JUSTIFY_FLEX_START,
  SPACING,
} from '@opentrons/components'
import styled from 'styled-components'
import { Divider } from '../../atoms/structure'

const IpItem = styled.div`
  flex: 1 1 calc(100% - 4rem);
  padding: 0 1rem;
  border: 0;
  border-radius: 0;
  outline: 0;
  line-height: 2rem;
`

// ToDo - at some point need to switch IconButton to a new component button
const IpTerminateButton = styled(IconButton)`
  padding: ${SPACING.spacing2};
  flex: 0 0 ${SPACING.spacing6};
  border-radius: 0;
`

export interface IpHostnameItemProps {
  candidate: string
  discovered: boolean
  removeIp: (ip: string) => unknown
}

export class IpHostnameItem extends React.Component<IpHostnameItemProps> {
  remove: () => unknown = () => this.props.removeIp(this.props.candidate)

  render(): JSX.Element {
    return (
      <Flex justifyContent={JUSTIFY_FLEX_START}>
        <IpItem>
          <Text
            fontSize={TYPOGRAPHY.fontSizeP}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            lineHeight={TYPOGRAPHY.lineHeight16}
            fontStyle={TYPOGRAPHY.fontStyleNormal}
            color={
              this.props.discovered ? COLORS.darkBlack : COLORS.successDisabled
            }
          >
            {this.props.candidate}
          </Text>
        </IpItem>
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
        <IpTerminateButton name="close" onClick={this.remove} />
        <Divider />
      </Flex>
    )
  }
}
