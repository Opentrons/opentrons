import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Slideout } from '../../atoms/Slideout'
import { COLORS, Flex, SPACING, Text, TYPOGRAPHY, InputField } from '@opentrons/components'
import { TertiaryButton } from '../../atoms/Buttons'
import { ExternalLink } from '../../atoms/Link/ExternalLink'

const SUPPORT_PAGE_LINK = "https://support.opentrons.com/en/articles/2934336-manually-adding-a-robot-s-ip-address";

interface ConnectRobotSlideoutProps {
    onCloseClick: () => unknown
    isExpanded: boolean
}

export const ConnectRobotSlideout = (props: ConnectRobotSlideoutProps): JSX.Element | null => {
    
    const { onCloseClick, isExpanded } = props
    const { t } = useTranslation('app_settings')

    return(
        <Slideout
          title={t('connect_ip')}
          onCloseClick={onCloseClick}
          isExpanded={isExpanded}
          height={`calc(100vh - ${SPACING.spacing4})`}
          footer={
              <TertiaryButton>
                    {t('connect_ip_button')}
              </TertiaryButton>
          }
        >
            <Text
            css={TYPOGRAPHY.p}
            >
                {t('connect_ip_description')}
            </Text>
            <ExternalLink
              href={SUPPORT_PAGE_LINK}
              css={TYPOGRAPHY.pSemiBold}
              id="ConnectIPAddressSupportPage"
            >
                {t('connect_ip_link')}
            </ExternalLink>
            <Text
            css={TYPOGRAPHY.pSemiBold}
            >
                {t('set_ip_description')}
            </Text>
            <Text
                css={TYPOGRAPHY.labelSemiBold}
            >
                {t('set_ip')}
            </Text>
            <Flex>
                <InputField />
                <TertiaryButton
                  css={TYPOGRAPHY.label}
                >
                    {t('add_ip_button')}
                </TertiaryButton>
            </Flex>
        </Slideout>
    )
}