import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  // DIRECTION_ROW,
  // ALIGN_FLEX_START,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  SPACING,
  // SIZE_AUTO,
  Text,
  TYPOGRAPHY,
  COLORS,
  Icon,
  SIZE_2,
  Link,
} from '@opentrons/components'
import { ManualIpHostnameForm } from './ManualIpHostname'
import { IpHostnameList } from './IpHostnameList'
import { Slideout } from '../../atoms/Slideout'
import { PrimaryButton } from '../../atoms/Buttons'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { Divider } from '../../atoms/structure'
import { getScanning } from '../../redux/discovery'

import type { State } from '../../redux/types'

const SUPPORT_PAGE_LINK =
  'https://support.opentrons.com/en/articles/2934336-manually-adding-a-robot-s-ip-address'

interface ConnectRobotSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => unknown
}

export function ConnectRobotSlideout(
  props: ConnectRobotSlideoutProps
): JSX.Element | null {
  const [mostRecentAddition, setMostRecentAddition] = React.useState<
    string | null
  >(null)

  console.log('ConnectRobotSlideout')
  const { onCloseClick, isExpanded } = props
  const { t } = useTranslation('app_settings')

  const scanning = useSelector<State>(getScanning)

  const displayLinkButton = (buttonLable: string): JSX.Element => {
    return (
      <Link
        role="button"
        css={TYPOGRAPHY.pSemiBold}
        color={COLORS.blue}
        // onClick={null}
        id="AppSettings_Connection_Button"
      >
        {buttonLable}
      </Link>
    )
  }

  useEffect(() => {
    if (!scanning) {
      setMostRecentAddition(null)
    }
  }, [scanning])

  return (
    <Slideout
      title={t('connect_ip')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height="100vh"
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
          {scanning ? (
            <Icon name="ot-spinner" size={SIZE_2} spin />
          ) : (
            [
              mostRecentAddition !== null ? (
                displayLinkButton(t('ip_refresh_button'))
              ) : (
                <>
                  <Text
                    fontSize={TYPOGRAPHY.fontSizeP}
                    lineHeight={TYPOGRAPHY.lineHeight16}
                    fontStyle={TYPOGRAPHY.fontStyleNormal}
                    color={COLORS.darkGreyEnabled}
                    margin={`0 ${SPACING.spacing2}`}
                  >
                    {t('ip_connect_timeout')}
                  </Text>
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
