import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  SPACING,
  COLORS,
  Icon,
  Btn,
  DIRECTION_ROW,
  ALIGN_START,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  TYPOGRAPHY,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { Chip } from '../../atoms/Chip'

import type { IconName } from '@opentrons/components'
import type { RenderContentType } from '../../pages/OnDeviceDisplay/RobotSettingsDashboard'
import type { NetworkConnection } from '../../pages/OnDeviceDisplay/hooks'

interface NetworkSettingsProps {
  networkConnection: NetworkConnection
  setRenderContent: (renderContentType: RenderContentType) => void
}

export function NetworkSettings({
  networkConnection,
  setRenderContent,
}: NetworkSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const {
    isWifiConnected,
    isEthernetConnected,
    isUsbConnected,
    activeSsid,
  } = networkConnection

  const handleButtonBackgroundColor = (isConnected: boolean): string =>
    isConnected ? COLORS.successBackgroundMed : COLORS.medGreyEnabled

  const handleChipText = (isConnected: boolean): string =>
    isConnected ? t('connected') : t('not_connected')

  const handleChipTextColor = (isConnected: boolean): string =>
    isConnected ? COLORS.successText : COLORS.darkGreyEnabled

  const handleChipIconColor = (isConnected: boolean): string =>
    isConnected ? COLORS.successEnabled : COLORS.successDisabled

  return (
    <>
      <Flex
        padding={`${SPACING.spacing6} ${SPACING.spacingXXL}`}
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_START}
      >
        <Btn onClick={() => setRenderContent(null)}>
          <Icon name="chevron-left" size="2.5rem" />
        </Btn>
        <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
          {t('network_settings')}
        </StyledText>
      </Flex>
      <Flex
        paddingX={SPACING.spacingXXL}
        marginTop={SPACING.spacing4}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing3}
      >
        {/* wifi */}
        <NetworkSettingButton
          buttonTitle={t('wifi')}
          buttonBackgroundColor={handleButtonBackgroundColor(isWifiConnected)}
          iconName="wifi"
          chipText={handleChipText(isWifiConnected)}
          chipTextColor={handleChipTextColor(isWifiConnected)}
          chipIconName="ot-check"
          chipIconColor={handleChipIconColor(isWifiConnected)}
          networkName={activeSsid}
        />
        {/* ethernet */}
        <NetworkSettingButton
          buttonTitle={t('ethernet')}
          buttonBackgroundColor={handleButtonBackgroundColor(
            isEthernetConnected
          )}
          iconName="ethernet"
          chipText={handleChipText(isEthernetConnected)}
          chipTextColor={handleChipTextColor(isEthernetConnected)}
          chipIconName="ot-check"
          chipIconColor={handleChipIconColor(isEthernetConnected)}
        />
        {/* usb hard-coded */}
        <NetworkSettingButton
          buttonTitle={t('usb')}
          buttonBackgroundColor={handleButtonBackgroundColor(isUsbConnected)}
          iconName="usb"
          chipText={handleChipText(isUsbConnected)}
          chipTextColor={handleChipTextColor(isUsbConnected)}
          chipIconName="ot-check"
          chipIconColor={handleChipIconColor(isUsbConnected)}
        />
      </Flex>
    </>
  )
}

interface NetworkSettingButtonProps {
  buttonTitle: string
  buttonBackgroundColor: string
  iconName: IconName
  chipText: string
  chipTextColor: string
  chipIconName: IconName
  chipIconColor: string
  networkName?: string
}
function NetworkSettingButton({
  buttonTitle,
  buttonBackgroundColor,
  iconName,
  chipText,
  chipTextColor,
  chipIconName,
  chipIconColor,
  networkName,
}: NetworkSettingButtonProps): JSX.Element {
  return (
    <Btn
      width="100%"
      padding={SPACING.spacing5}
      backgroundColor={buttonBackgroundColor}
      borderRadius="0.75rem"
    >
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing5}>
        <Flex gridGap={SPACING.spacing3} width="34.8125rem">
          <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing3}>
            <Icon name={iconName} size="3rem" />
            <StyledText
              fontSize="1.5rem"
              lineHeight="2.0625rem"
              fontWeight="700"
            >
              {buttonTitle}
            </StyledText>
            {networkName != null ? (
              <StyledText
                fontSize="1.5rem"
                lineHeight="2.0625rem"
                fontWeight={TYPOGRAPHY.fontWeightRegular}
              >
                {networkName}
              </StyledText>
            ) : null}
          </Flex>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} width="15.1875rem">
          <Chip
            text={chipText}
            textColor={chipTextColor}
            iconName={chipIconName}
            iconColor={chipIconColor}
          />
        </Flex>
        <Flex justifyContent="flex-end" alignSelf="stretch">
          <Btn onClick={() => console.log('setup')}>
            <Icon name="chevron-right" size="3rem" />
          </Btn>
        </Flex>
      </Flex>
    </Btn>
  )
}
