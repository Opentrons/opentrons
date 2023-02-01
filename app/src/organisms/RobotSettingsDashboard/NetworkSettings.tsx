import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

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
import {
  fetchStatus,
  fetchWifiList,
  getNetworkInterfaces,
  getWifiKeys,
  getWifiList,
} from '../../redux/networking'

import type { IconName } from '@opentrons/components'
import type { Dispatch, State } from '../../redux/types'
import type { RenderContentType } from '../../pages/OnDeviceDisplay/RobotSettingsDashboard'

interface NetworkSettingsProps {
  robotName: string
  setRenderContent: (renderContentType: RenderContentType) => void
}
export function NetworkSettings({
  robotName,
  setRenderContent,
}: NetworkSettingsProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const dispatch = useDispatch<Dispatch>()
  const list = useSelector((state: State) => getWifiList(state, robotName))
  const { wifi, ethernet } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const isEAPTLS =
    useSelector((state: State) => getWifiKeys(state, robotName)).length > 0
  const activeNetwork = list.find(nw => nw.active)

  React.useEffect(() => {
    dispatch(fetchStatus(robotName))
    dispatch(fetchWifiList(robotName))
  }, [])

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
          iconName="wifi"
          chipIconName="ot-check"
          networkName={activeNetwork?.ssid}
          isConnected={wifi?.ipAddress != null}
        />
        {/* ethernet */}
        <NetworkSettingButton
          buttonTitle={t('ethernet')}
          iconName="ethernet"
          chipIconName="ot-check"
          isConnected={ethernet?.ipAddress != null}
        />
        {/* usb */}
        <NetworkSettingButton
          buttonTitle={t('usb')}
          iconName="usb"
          chipIconName="ot-check"
          isConnected={isEAPTLS}
        />
      </Flex>
    </>
  )
}

// Note:kj 01/31/2023 This might be moved into atoms as Chip
interface StatusChipProps {
  isConnected: boolean // This prop might be status: string
  iconName: IconName
  chipTitle: string
}
function StatusChip({
  isConnected,
  iconName,
  chipTitle,
}: StatusChipProps): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      padding={`${SPACING.spacing3} ${SPACING.spacing4}`}
      backgroundColor={COLORS.white}
      borderRadius="1.9375rem"
      alignItems={ALIGN_CENTER}
      gridGap={SPACING.spacing3}
    >
      <Icon
        name={iconName}
        color={isConnected ? COLORS.successEnabled : COLORS.successDisabled}
        size="1.5rem"
      />
      <StyledText
        fontSize="1.25rem"
        lineHeight="1.6875rem"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        color={isConnected ? COLORS.successText : COLORS.darkGreyEnabled}
      >
        {chipTitle}
      </StyledText>
    </Flex>
  )
}

interface NetworkSettingButtonProps {
  buttonTitle: string
  iconName: IconName
  chipIconName: IconName
  networkName?: string
  isConnected: boolean
}
function NetworkSettingButton({
  buttonTitle,
  iconName,
  chipIconName,
  networkName,
  isConnected,
}: NetworkSettingButtonProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  return (
    <Btn
      width="100%"
      padding={SPACING.spacing5}
      backgroundColor={
        isConnected ? COLORS.successBackgroundMed : COLORS.medGreyEnabled
      }
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
          <StatusChip
            isConnected={isConnected}
            chipTitle={isConnected ? t('Connected') : t('not_connected')}
            iconName={chipIconName}
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
