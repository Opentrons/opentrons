import * as React from 'react'
import { useSelector } from 'react-redux'
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
  BORDERS,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { Chip } from '../../../../atoms/Chip'
import { useWifiList } from '../../../../resources/networking/hooks'
import { getLocalRobot } from '../../../../redux/discovery'
import { EthernetConnectionDetails } from './EthernetConnectionDetails'
import { WifiConnectionDetails } from './WifiConnectionDetails'

import type { IconName } from '@opentrons/components'
import type { NetworkConnection } from '../../../../pages/OnDeviceDisplay/hooks'
import type { ChipType } from '../../../../atoms/Chip'
import type { SettingOption } from '../../../../pages/OnDeviceDisplay/RobotSettingsDashboard'

export type ConnectionType = 'wifi' | 'ethernet' // TODO (kj: 04/05/2023) add 'usb' as options once implemented

interface NetworkSettingsProps {
  networkConnection: NetworkConnection
  setCurrentOption: (currentOption: SettingOption | null) => void
}

export function NetworkSettings({
  networkConnection,
  setCurrentOption,
}: NetworkSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [
    showDetailsTab,
    setShowDetailsTab,
  ] = React.useState<ConnectionType | null>(null)
  const {
    isWifiConnected,
    isEthernetConnected,
    isUsbConnected,
    activeSsid,
  } = networkConnection
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const list = useWifiList(robotName)
  const connectedWifiAuthType = list.find(wifi => wifi.ssid === activeSsid)
    ?.securityType

  let screenTitle = ''

  if (showDetailsTab === null) {
    screenTitle = 'network_settings'
  } else if (showDetailsTab === 'wifi') {
    screenTitle = 'wifi'
  } else if (showDetailsTab === 'ethernet') {
    screenTitle = 'ethernet'
  }

  const handleChipType = (isConnected: boolean): ChipType => {
    return isConnected ? 'success' : 'neutral'
  }

  const handleButtonBackgroundColor = (isConnected: boolean): string =>
    isConnected ? COLORS.successBackgroundMed : COLORS.medGreyEnabled

  const handleChipText = (isConnected: boolean): string =>
    isConnected ? t('connected') : t('not_connected')

  const handleNavigate = (): void => {
    if (showDetailsTab !== null) {
      setShowDetailsTab(null)
    } else {
      setCurrentOption(null)
    }
  }

  const renderScreen = (): JSX.Element => {
    switch (showDetailsTab) {
      case 'wifi':
        return (
          <WifiConnectionDetails
            ssid={activeSsid}
            authType={connectedWifiAuthType}
          />
        )
      case 'ethernet':
        return <EthernetConnectionDetails />
      default:
        return (
          <Flex
            paddingX={SPACING.spacing40}
            marginTop={SPACING.spacing16}
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
          >
            {/* wifi */}
            <NetworkSettingButton
              buttonTitle={t('wifi')}
              buttonBackgroundColor={handleButtonBackgroundColor(
                isWifiConnected
              )}
              iconName="wifi"
              chipType={handleChipType(isWifiConnected)}
              chipText={handleChipText(isWifiConnected)}
              chipIconName="ot-check"
              networkName={activeSsid}
              displayDetailsTab={() => setShowDetailsTab('wifi')}
            />
            {/* ethernet */}
            <NetworkSettingButton
              buttonTitle={t('ethernet')}
              buttonBackgroundColor={handleButtonBackgroundColor(
                isEthernetConnected
              )}
              iconName="ethernet"
              chipType={handleChipType(isEthernetConnected)}
              chipText={handleChipText(isEthernetConnected)}
              chipIconName="ot-check"
              displayDetailsTab={() => setShowDetailsTab('ethernet')}
            />
            {/* usb hard-coded */}
            <NetworkSettingButton
              buttonTitle={t('usb')}
              buttonBackgroundColor={handleButtonBackgroundColor(
                isUsbConnected
              )}
              iconName="usb"
              chipType={handleChipType(isUsbConnected)}
              chipText={handleChipText(isUsbConnected)}
              chipIconName="ot-check"
              displayDetailsTab={() => console.log('Not Implemented')}
            />
          </Flex>
        )
    }
  }

  return (
    <>
      <Flex
        padding={`${SPACING.spacing32} ${SPACING.spacing40}`}
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_START}
      >
        <Btn onClick={handleNavigate}>
          <Icon name="chevron-left" size="2.5rem" />
        </Btn>
        <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
          {t(screenTitle)}
        </StyledText>
      </Flex>
      {renderScreen()}
    </>
  )
}

interface NetworkSettingButtonProps {
  buttonTitle: string
  buttonBackgroundColor: string
  iconName: IconName
  chipType: ChipType
  chipText: string
  chipIconName: IconName
  networkName?: string
  displayDetailsTab: () => void
}
function NetworkSettingButton({
  buttonTitle,
  buttonBackgroundColor,
  iconName,
  chipType,
  chipText,
  chipIconName,
  networkName,
  displayDetailsTab,
}: NetworkSettingButtonProps): JSX.Element {
  return (
    <>
      <Btn
        width="100%"
        padding={SPACING.spacing24}
        backgroundColor={buttonBackgroundColor}
        borderRadius={BORDERS.size_three}
        onClick={displayDetailsTab}
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
            <Chip type={chipType} text={chipText} iconName={chipIconName} />
          </Flex>
          <Flex justifyContent="flex-end" alignSelf="stretch">
            <Btn onClick={() => console.log('setup')}>
              <Icon name="chevron-right" size="3rem" />
            </Btn>
          </Flex>
        </Flex>
      </Btn>
    </>
  )
}
