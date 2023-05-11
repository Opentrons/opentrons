import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  Icon,
  Link,
  PrimaryButton,
} from '@opentrons/components'

import { ManualIpHostnameForm } from './ManualIpHostnameForm'
import { ManualIpHostnameList } from './ManualIpHostnameList'
import { Slideout } from '../../atoms/Slideout'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'
import { getScanning, startDiscovery } from '../../redux/discovery'

import type { Dispatch, State } from '../../redux/types'

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
  const [mostRecentAddition, setMostRecentAddition] = React.useState<
    string | null
  >(null)
  const [mostRecentDiscovered, setMostRecentDiscovered] = React.useState<
    boolean | null
  >(null)
  const { t } = useTranslation(['app_settings', 'shared'])
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

  React.useEffect(() => {
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
        <StyledText as="p" marginBottom={SPACING.spacing8}>
          {t('ip_description_first')}
        </StyledText>
        <StyledText as="p">{t('ip_description_second')}</StyledText>
        <ExternalLink
          href={SUPPORT_PAGE_LINK}
          css={TYPOGRAPHY.pSemiBold}
          id="ConnectIPAddressSupportPage"
          marginTop={SPACING.spacing16}
        >
          {t('connect_ip_link')}
        </ExternalLink>
        <Divider marginY={SPACING.spacing24} />
        <StyledText as="p" css={TYPOGRAPHY.pSemiBold}>
          {t('add_ip_hostname')}
        </StyledText>
        <ManualIpHostnameForm setMostRecentAddition={setMostRecentAddition} />

        <Flex
          marginTop={SPACING.spacing24}
          marginBottom={SPACING.spacing16}
          justifyContent={ALIGN_FLEX_END}
        >
          {Boolean(isScanning) ? (
            <Flex flexDirection={DIRECTION_ROW}>
              <StyledText
                as="p"
                color={COLORS.darkGreyEnabled}
                marginRight={SPACING.spacing8}
              >
                {t('searching')}
              </StyledText>{' '}
              <Icon name="ot-spinner" size="1.25rem" spin />
            </Flex>
          ) : (
            [
              mostRecentAddition != null && !(mostRecentDiscovered ?? false) ? (
                <>
                  <StyledText
                    as="p"
                    color={COLORS.darkGreyEnabled}
                    marginX={SPACING.spacing4}
                  >
                    {t('discovery_timeout')}
                  </StyledText>
                  {displayLinkButton(t('shared:try_again'))}
                </>
              ) : (
                displayLinkButton(t('shared:refresh'))
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
