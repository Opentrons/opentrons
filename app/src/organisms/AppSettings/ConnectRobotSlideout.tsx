import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_FLEX_END,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  Link,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { ManualIpHostnameForm } from './ManualIpHostnameForm'
import { ManualIpHostnameList } from './ManualIpHostnameList'
import { Slideout } from '/app/atoms/Slideout'
import { ExternalLink } from '/app/atoms/Link/ExternalLink'
import { Divider } from '/app/atoms/structure'
import { getScanning, startDiscovery } from '/app/redux/discovery'

import type { Dispatch, State } from '/app/redux/types'

const SUPPORT_PAGE_LINK =
  'https://support.opentrons.com/s/article/Manually-adding-a-robot-s-IP-address'

interface ConnectRobotSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
}

export function ConnectRobotSlideout({
  isExpanded,
  onCloseClick,
}: ConnectRobotSlideoutProps): JSX.Element | null {
  const [mostRecentAddition, setMostRecentAddition] = useState<string | null>(
    null
  )
  const [mostRecentDiscovered, setMostRecentDiscovered] = useState<
    boolean | null
  >(null)
  const { t } = useTranslation(['app_settings', 'shared', 'branded'])
  const dispatch = useDispatch<Dispatch>()
  const refreshDiscovery = (): unknown => dispatch(startDiscovery())
  const isScanning = useSelector<State>(getScanning)

  const displayLinkButton = (buttonLabel: string): JSX.Element => {
    return (
      <Link
        role="button"
        css={TYPOGRAPHY.linkPSemiBold}
        onClick={refreshDiscovery}
        id="AppSettings_Connection_Button"
        textTransform={TYPOGRAPHY.textTransformCapitalize}
      >
        {buttonLabel}
      </Link>
    )
  }

  useEffect(() => {
    dispatch(startDiscovery())
  }, [dispatch])

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
        <LegacyStyledText as="p" marginBottom={SPACING.spacing8}>
          {t('ip_description_first')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          {t('branded:ip_description_second')}
        </LegacyStyledText>
        <ExternalLink
          href={SUPPORT_PAGE_LINK}
          css={TYPOGRAPHY.pSemiBold}
          id="ConnectIPAddressSupportPage"
          marginTop={SPACING.spacing16}
        >
          {t('connect_ip_link')}
        </ExternalLink>
        <Divider marginY={SPACING.spacing24} />
        <LegacyStyledText as="p" css={TYPOGRAPHY.pSemiBold}>
          {t('add_ip_hostname')}
        </LegacyStyledText>
        <ManualIpHostnameForm setMostRecentAddition={setMostRecentAddition} />

        <Flex
          marginTop={SPACING.spacing24}
          marginBottom={SPACING.spacing16}
          justifyContent={ALIGN_FLEX_END}
        >
          {Boolean(isScanning) ? (
            <Flex flexDirection={DIRECTION_ROW}>
              <LegacyStyledText
                as="p"
                color={COLORS.grey50}
                marginRight={SPACING.spacing8}
              >
                {t('searching')}
              </LegacyStyledText>{' '}
              <Icon name="ot-spinner" size="1.25rem" spin />
            </Flex>
          ) : (
            [
              mostRecentAddition != null && !(mostRecentDiscovered ?? false) ? (
                <>
                  <LegacyStyledText
                    as="p"
                    color={COLORS.grey50}
                    marginX={SPACING.spacing4}
                  >
                    {t('discovery_timeout')}
                  </LegacyStyledText>
                  {displayLinkButton(t('shared:try_again') as string)}
                </>
              ) : (
                displayLinkButton(t('shared:refresh') as string)
              ),
            ]
          )}
        </Flex>
        <ManualIpHostnameList
          mostRecentAddition={mostRecentAddition}
          setMostRecentDiscovered={setMostRecentDiscovered}
          setMostRecentAddition={setMostRecentAddition}
        />
      </Flex>
    </Slideout>
  )
}
