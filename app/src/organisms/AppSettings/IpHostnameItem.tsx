import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  IconButton,
  COLORS,
  Text,
  TYPOGRAPHY,
  Flex,
  JUSTIFY_FLEX_START,
  JUSTIFY_CENTER,
  SPACING,
} from '@opentrons/components'
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
  justAdded: boolean
}

export function IpHostnameItem(props: IpHostnameItemProps): JSX.Element {
  const remove = (): void => {
    props.removeIp(props.candidate)
  }
  const { t } = useTranslation('app_settings')
  const getDiscoveryText = (): string | null => {
    if (props.discovered) {
      return t('ip_available')
    } else if (props.justAdded) {
      return null
    } else {
      return t('ip_not_found')
    }
  }

  return (
    <React.Fragment>
      <Flex justifyContent={JUSTIFY_FLEX_START} alignItems={JUSTIFY_CENTER}>
        <IpItem>
          <Text
            fontSize={TYPOGRAPHY.fontSizeP}
            fontWeight={TYPOGRAPHY.fontWeightRegular}
            lineHeight={TYPOGRAPHY.lineHeight16}
            fontStyle={TYPOGRAPHY.fontStyleNormal}
            color={props.discovered ? COLORS.darkBlack : COLORS.successDisabled}
          >
            {props.candidate}
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
          {getDiscoveryText()}
        </Text>
        <IpTerminateButton name="close" onClick={remove} />
      </Flex>
      <Divider width="100%" />
    </React.Fragment>
  )
}
