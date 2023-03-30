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

import { StyledText } from '../../../atoms/text'
import { Chip } from '../../../atoms/Chip'
import { WifiConnectionDetails } from '../SetupNetwork'
import { getWifiList } from '../../../redux/networking'
import { getLocalRobot } from '../../../redux/discovery'

import type { IconName } from '@opentrons/components'
import type { NetworkConnection } from '../../../pages/OnDeviceDisplay/hooks'
import type { ChipType } from '../../../atoms/Chip'
import type { SettingOption } from '../../../pages/OnDeviceDisplay/RobotSettingsDashboard'
import type { State } from '../../../redux/types'

export type ConnectionType = 'wifi' // TODO (jb 2-24-2023) add 'ethernet' and 'usb' as options once implemented

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
  const list = useSelector((state: State) => getWifiList(state, robotName))
  const connectedWifiAuthType = list.find(wifi => wifi.ssid === activeSsid)
    ?.securityType

  let screenTitle = ''

  if (showDetailsTab === null) {
    screenTitle = 'network_settings'
  } else if (showDetailsTab === 'wifi') {
    screenTitle = 'wifi'
  } // TODO (jb 2-24-2023) implement ethernet and usb details screen titles

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
    if (showDetailsTab === null) {
      return (
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
            displayDetailsTab={() => console.log('Not Implemented')}
          />
          {/* usb hard-coded */}
          <NetworkSettingButton
            buttonTitle={t('usb')}
            buttonBackgroundColor={handleButtonBackgroundColor(isUsbConnected)}
            iconName="usb"
            chipType={handleChipType(isUsbConnected)}
            chipText={handleChipText(isUsbConnected)}
            chipIconName="ot-check"
            displayDetailsTab={() => console.log('Not Implemented')}
          />
        </Flex>
      )
    } else {
      return (
        <WifiConnectionDetails
          ssid={activeSsid}
          authType={connectedWifiAuthType}
          wifiList={list}
          showHeader={false}
          showWifiListButton={true}
        />
      )
    }
  }

  return (
    <>
      <Flex
        padding={`${SPACING.spacing6} ${SPACING.spacingXXL}`}
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
        padding={SPACING.spacing5}
        backgroundColor={buttonBackgroundColor}
        borderRadius={BORDERS.size_three}
        onClick={displayDetailsTab}
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
