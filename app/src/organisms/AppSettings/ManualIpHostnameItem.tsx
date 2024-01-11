import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import {
  Btn,
  Icon,
  LEGACY_COLORS,
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
  border: 0;
  border-radius: 0;
  outline: 0;
  line-height: 2rem;
`

const CLOSE_ICON_STYLE = css`
  border-radius: 50%;

  &:hover {
    background: ${LEGACY_COLORS.lightGreyHover};
  }
  &:active {
    background: ${LEGACY_COLORS.lightGreyPressed};
  }
`
interface IpHostnameItemProps {
  candidate: string
  discovered: boolean
  removeIp: (ip: string) => unknown
  isLast: boolean
  mostRecentAddition: string | null
  setMostRecentAddition: (ip: string | null) => void
  setMostRecentDiscovered: (discovered: boolean) => void
}

export function ManualIpHostnameItem({
  candidate,
  discovered,
  removeIp,
  isLast,
  mostRecentAddition,
  setMostRecentAddition,
  setMostRecentDiscovered,
}: IpHostnameItemProps): JSX.Element {
  const remove = (): void => {
    removeIp(candidate)
  }
  const { t } = useTranslation('app_settings')
  const justAdded = candidate === mostRecentAddition
  const getDiscoveryText = (): string | null => {
    if (discovered) {
      return t('ip_available')
    } else if (justAdded) {
      return null
    } else {
      return t('not_found')
    }
  }

  React.useEffect(() => {
    if (justAdded) {
      setMostRecentDiscovered(discovered)
      // Note this is to avoid the case that not found but not display the message
      setMostRecentAddition('searching')
    }
  }, [justAdded, discovered, setMostRecentDiscovered, setMostRecentAddition])

  return (
    <>
      <Flex justifyContent={JUSTIFY_FLEX_START} alignItems={JUSTIFY_CENTER}>
        <IpItem>
          <StyledText
            as="p"
            data-testid="ip-hostname"
            color={
              discovered ? LEGACY_COLORS.darkBlackEnabled : LEGACY_COLORS.successDisabled
            }
          >
            {candidate}
          </StyledText>
        </IpItem>
        <StyledText
          as="label"
          color={LEGACY_COLORS.darkGreyEnabled}
          css={{
            'white-space': 'nowrap',
          }}
        >
          {getDiscoveryText()}
        </StyledText>
        <Btn
          size={TYPOGRAPHY.lineHeight20}
          color={LEGACY_COLORS.darkBlackEnabled}
          onClick={remove}
          marginLeft={SPACING.spacing16}
          data-testid="close-button"
        >
          <Icon name="close" css={CLOSE_ICON_STYLE} />
        </Btn>
      </Flex>
      {!isLast && <Divider width="100%" />}
    </>
  )
}
