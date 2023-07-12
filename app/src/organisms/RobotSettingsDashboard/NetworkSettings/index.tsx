import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  SPACING,
  COLORS,
  Icon,
  Btn,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  TYPOGRAPHY,
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'
import { Chip } from '../../../atoms/Chip'
import { ChildNavigation } from '../../../organisms/ChildNavigation'

import type { IconName } from '@opentrons/components'
import type { NetworkConnection } from '../../../pages/OnDeviceDisplay/hooks'
import type { ChipType } from '../../../atoms/Chip'
import type { SetSettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'

export type ConnectionType = 'wifi' | 'ethernet' | 'usb'

interface NetworkSettingsProps {
  networkConnection: NetworkConnection
  setCurrentOption: SetSettingOption
}

export function NetworkSettings({
  networkConnection,
  setCurrentOption,
}: NetworkSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { isWifiConnected, isEthernetConnected, activeSsid } = networkConnection

  const handleChipType = (isConnected: boolean): ChipType => {
    return isConnected ? 'success' : 'neutral'
  }

  const handleButtonBackgroundColor = (isConnected: boolean): string =>
    isConnected ? COLORS.green3 : COLORS.light1

  const handleChipText = (isConnected: boolean): string =>
    isConnected ? t('connected') : t('not_connected')

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <ChildNavigation
        header={t('network_settings')}
        onClickBack={() => setCurrentOption(null)}
      />
      <Flex
        paddingX={SPACING.spacing40}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
      >
        <NetworkSettingButton
          buttonTitle={t('wifi')}
          backgroundColor={handleButtonBackgroundColor(isWifiConnected)}
          iconName="wifi"
          chipType={handleChipType(isWifiConnected)}
          chipText={handleChipText(isWifiConnected)}
          networkName={activeSsid}
          onClick={() => setCurrentOption('RobotSettingsWifi')}
        />
        <NetworkSettingButton
          buttonTitle={t('ethernet')}
          backgroundColor={handleButtonBackgroundColor(isEthernetConnected)}
          iconName="ethernet"
          chipType={handleChipType(isEthernetConnected)}
          chipText={handleChipText(isEthernetConnected)}
          onClick={() => setCurrentOption('EthernetConnectionDetails')}
        />
      </Flex>
    </Flex>
  )
}

interface NetworkSettingButtonProps extends React.ComponentProps<typeof Btn> {
  buttonTitle: string
  iconName: IconName
  chipType: ChipType
  chipText: string
  networkName?: string
}

function NetworkSettingButton({
  backgroundColor,
  buttonTitle,
  iconName,
  chipType,
  chipText,
  networkName,
  onClick,
}: NetworkSettingButtonProps): JSX.Element {
  return (
    <Btn
      width="100%"
      paddingX={SPACING.spacing24}
      paddingY={SPACING.spacing20}
      backgroundColor={backgroundColor}
      borderRadius={BORDERS.borderRadiusSize3}
      onClick={onClick}
    >
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing24}>
        <Flex gridGap={SPACING.spacing8} width="34.8125rem">
          <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing24}>
            <Icon name={iconName} size="3rem" />
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing2}>
              <StyledText
                fontSize={TYPOGRAPHY.fontSize28}
                lineHeight={TYPOGRAPHY.lineHeight36}
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                textAlign={TYPOGRAPHY.textAlignLeft}
              >
                {buttonTitle}
              </StyledText>
              {networkName != null ? (
                <StyledText
                  fontSize={TYPOGRAPHY.fontSize28}
                  lineHeight={TYPOGRAPHY.lineHeight36}
                  fontWeight={TYPOGRAPHY.fontWeightRegular}
                  color={COLORS.darkBlack70}
                >
                  {networkName}
                </StyledText>
              ) : null}
            </Flex>
          </Flex>
        </Flex>
        <Flex alignItems={ALIGN_CENTER} width="15.1875rem">
          <Chip
            type={chipType}
            text={chipText}
            iconName="connection-status"
            background={false}
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
