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
export interface ManualIpHostnameItemProps {
  candidate: string
  discovered: boolean
  removeIp: (ip: string) => unknown
  justAdded: boolean
  isLast: boolean
}

export function ManualIpHostnameItem({
  candidate,
  discovered,
  removeIp,
  justAdded,
  isLast,
}: ManualIpHostnameItemProps): JSX.Element {
  const remove = (): void => {
    removeIp(candidate)
  }
  const { t } = useTranslation('app_settings')
  const getDiscoveryText = (): string | null => {
    if (discovered) {
      return t('ip_available')
    } else if (justAdded) {
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
            color={discovered ? COLORS.darkBlack : COLORS.successDisabled}
          >
            {candidate}
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
      {!isLast && <Divider width="100%" />}
    </>
  )
}
