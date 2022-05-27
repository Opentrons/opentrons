import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  SPACING,
  Text,
  TYPOGRAPHY,
  COLORS,
  Icon,
  SIZE_2,
  Link,
} from '@opentrons/components'
import { ManualIpHostnameForm } from './ManualIpHostnameForm'
import { IpHostnameList } from './IpHostnameList'
import { Slideout } from '../../atoms/Slideout'
import { PrimaryButton } from '../../atoms/buttons'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'
import { getScanning, startDiscovery } from '../../redux/discovery'

import type { Dispatch, State } from '../../redux/types'

const SUPPORT_PAGE_LINK =
  'https://support.opentrons.com/s/article/Manually-adding-a-robot-s-IP-address'

export interface ConnectRobotSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
}

export function ConnectRobotSlideout(
  props: ConnectRobotSlideoutProps
): JSX.Element | null {
  const [mostRecentAddition, setMostRecentAddition] = React.useState<
    string | null
  >(null)
  const { onCloseClick, isExpanded } = props
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const refreshDiscovery = (): unknown => dispatch(startDiscovery())
  const isScanning = useSelector<State>(getScanning)

  const displayLinkButton = (buttonLabel: string): JSX.Element => {
    return (
      <Link
        role="button"
        css={TYPOGRAPHY.pSemiBold}
        color={COLORS.blue}
        onClick={refreshDiscovery}
        id="AppSettings_Connection_Button"
      >
        {buttonLabel}
      </Link>
    )
  }

  React.useEffect(() => {
    if (!isScanning) {
      setMostRecentAddition(null)
    }
  }, [isScanning])

  return (
    <Slideout
      title={t('connect_ip')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton onClick={onCloseClick} width="100%">
          {t('connect_ip_button')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Text fontSize={TYPOGRAPHY.fontSizeP} marginBottom={SPACING.spacing3}>
          {t('ip_description_first')}
        </Text>
        <Text fontSize={TYPOGRAPHY.fontSizeP}>
          {t('ip_description_second')}
        </Text>
        <ExternalLink
          href={SUPPORT_PAGE_LINK}
          css={TYPOGRAPHY.pSemiBold}
          id="ConnectIPAddressSupportPage"
          marginTop={SPACING.spacing4}
        >
          {t('connect_ip_link')}
        </ExternalLink>
        <Divider marginY={SPACING.spacing5} />
        <Text css={TYPOGRAPHY.pSemiBold}>{t('add_ip_hostname')}</Text>
        <ManualIpHostnameForm setMostRecentAddition={setMostRecentAddition} />

        <Flex
          marginTop={SPACING.spacing5}
          marginBottom={SPACING.spacing4}
          justifyContent={ALIGN_FLEX_END}
        >
          {isScanning ? (
            <Icon name="ot-spinner" size={SIZE_2} spin />
          ) : (
            [
              mostRecentAddition !== null ? (
                displayLinkButton(t('ip_refresh_button'))
              ) : (
                <>
                  <StyledText
                    as="p"
                    color={COLORS.darkGreyEnabled}
                    margin={`0 ${SPACING.spacing2}`}
                  >
                    {t('ip_connect_timeout')}
                  </StyledText>
                  {displayLinkButton(t('ip_reconnect_button'))}
                </>
              ),
            ]
          )}
        </Flex>
        <IpHostnameList mostRecentAddition={mostRecentAddition} />
      </Flex>
    </Slideout>
  )
}
