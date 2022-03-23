import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Slideout } from '../../atoms/Slideout'
import {
  Flex,
  // DIRECTION_ROW,
  // ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  SPACING,
  // SIZE_AUTO,
  Text,
  TYPOGRAPHY,
  FlatButton,
  COLORS,
} from '@opentrons/components'
import { PrimaryButton } from '../../atoms/Buttons'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { Divider } from '../../atoms/structure'
import { ManualIpHostnameForm } from './ManualIpHostname'
import { IpHostnameList } from './IpHostnameList'

const SUPPORT_PAGE_LINK =
  'https://support.opentrons.com/en/articles/2934336-manually-adding-a-robot-s-ip-address'

interface ConnectRobotSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => unknown
}

export function ConnectRobotSlideout(
  props: ConnectRobotSlideoutProps
): JSX.Element | null {
  // const [isDicoveyrMode, setIsDiscoveryMode] = React.useState<boolean>(false)
  // const [isDiscoveryModeFail, setIsDiscoveryModeFail] = React.useState<boolean>(false)
  // const [ipHostnameValue, setIpHostnameValue] = React.useState<string>('')
  // const [isInvalidInput, setISInvalidInput] = React.useState<boolean>(false)

  console.log('ConnectRobotSlideout')
  const { onCloseClick, isExpanded } = props
  const { t } = useTranslation('app_settings')

  return (
    <Slideout
      title={t('connect_ip')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height="100vh"
      footer={
        // Radius 4px
        // onClick Add ip/hostname + onCloseClick
        <PrimaryButton onClick={null} width="100%">
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
        {/* <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_FLEX_START}> */}
        {/* <Flex
          flexDirection={DIRECTION_COLUMN}
          marginTop={SPACING.spacing3}
          // paddingRight={SPACING.spacing4}
          // paddingLeft={SPACING.spacing4}
        > */}
        <ManualIpHostnameForm />
        {/* IP/Hostname action buttons */}
        {/* spinner, refresh, try again, fresh list */}
        <IpHostnameList />
        {/* </Flex> */}
        {/* </Flex> */}
      </Flex>
    </Slideout>
  )
}
