import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import {
  Btn,
  Icon,
  COLORS,
  Text,
  TYPOGRAPHY,
  Flex,
  JUSTIFY_FLEX_START,
  JUSTIFY_CENTER,
  SPACING,
} from '@opentrons/components'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'

const IpItem = styled.div`
  flex: 1 1 auto;
  padding: 0 1rem;
  border: 0;
  border-radius: 0;
  outline: 0;
  line-height: 2rem;
`
export interface IpHostnameItemProps {
  candidate: string
  discovered: boolean
  removeIp: (ip: string) => unknown
  justAdded: boolean
  isLast: boolean
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
    <>
      <Flex justifyContent={JUSTIFY_FLEX_START} alignItems={JUSTIFY_CENTER}>
        <IpItem>
          <StyledText
            as="p"
            data-testid={`ip-hostname`}
            color={props.discovered ? COLORS.darkBlack : COLORS.successDisabled}
          >
            {props.candidate}
          </StyledText>
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
        <Btn
          size={TYPOGRAPHY.lineHeight20}
          color={COLORS.darkBlack}
          onClick={remove}
          marginLeft={SPACING.spacing4}
          data-testid="close-button"
        >
          <Icon name="close" />
        </Btn>
      </Flex>
      {!props.isLast && <Divider width="100%" />}
    </>
  )
}
