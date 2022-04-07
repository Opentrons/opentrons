import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  DropdownField,
  useInterval,
  CheckboxField,
} from '@opentrons/components'

import {
  getWifiList,
  fetchWifiList,
  postWifiConfigure,
  getEapOptions,
} from '../../../redux/networking'
import * as RobotApi from '../../../redux/robot-api'
import { Slideout } from '../../../atoms/Slideout'
import { PrimaryButton } from '../../../atoms/Buttons'
import { StyledText } from '../../../atoms/text'
import { InputField } from '../../../atoms/InputField'

import type { State, Dispatch } from '../../../redux/types'
import type { WifiNetwork } from '../../../redux/networking/types'
import type { DropdownOption } from '@opentrons/components'

interface NetworkingSlideoutProps {
  isExpanded: boolean
  onCloseClick: () => void
  robotName: string
}

const LIST_REFRESH_MS = 10000

export function NetworkingSlideout({
  isExpanded,
  onCloseClick,
  robotName,
}: NetworkingSlideoutProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [dispatchApi] = RobotApi.useDispatchApiRequest()
  const initialNetwork = {
    ssid: '',
    password: '',
    security: '',
    securityType: 'none',
  }
  const [selectedNetwork, setSelectedNetwork] = React.useState<WifiNetwork>(
    initialNetwork
  )
  const [wifiPassword, setWifiPassword] = React.useState<string | null>(null)
  const [isShowPassword, setIsShowPassword] = React.useState<boolean>(false)
  const selectedItem = true // dummy
  const dispatch = useDispatch<Dispatch>()

  // Todo
  // when a user selects a wifi network, show a textbox for password
  // and activate the connect to network button
  // when a use clicks the connect to network button, close the slideout immediately
  // if a user selects a wifi that its securityType is none not show the password textbox and checkbox

  // when a user clicks the connect to wifi button, dispatch a request to connect to wifi

  const list = useSelector((state: State) => getWifiList(state, robotName))
  const eapOptions = useSelector((state: State) =>
    getEapOptions(state, robotName)
  )

  const initialOption: DropdownOption = {
    name: t('wireless_slideout_network_password_initial_message'),
    value: '',
    disabled: true,
  }
  const networkOptions: DropdownOption[] = list.map(network => {
    return {
      name: network.ssid,
      value: network.ssid,
    }
  })
  console.log('robot', robotName)
  console.log('wifi list', list)

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedNetwork(event.target.value)
  }

  const handleConnect = (): void => {
    const options = {
      ssid: selectedNetwork.ssid,
      psk: wifiPassword || '',
      securityType: selectedNetwork.securityType,
      hidden: false,
      eapConfig: eapOptions,
    }
    dispatchApi(postWifiConfigure(robotName, options))
  }

  useInterval(() => dispatch(fetchWifiList(robotName)), LIST_REFRESH_MS, true)

  return (
    <Slideout
      title={t('wireless_network_connect')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height={`calc(100vh - ${SPACING.spacing4})`}
      footer={
        <PrimaryButton
          disabled={selectedItem}
          onClick={null}
          width="100%"
          marginBottom={SPACING.spacing4}
        >
          {t('wireless_connect_button')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p">{t('wireless_slideout_network_name')}</StyledText>
        <Flex>
          <DropdownField
            options={[initialOption, ...networkOptions]}
            onChange={handleChange}
            value={selectedNetwork}
            id={`RobotSettings_networking_${robotName}`}
          />
        </Flex>
        {(list.find(network => network?.ssid === selectedNetwork)
          ?.securityType !== 'none' ||
          selectedNetwork.securityType != null) && (
          <>
            <StyledText
              as="p"
              marginTop={SPACING.spacing4}
              marginBottom={SPACING.spacing3}
            >
              {t('wireless_slideout_password')}
            </StyledText>
            <InputField
              data-testid="RobotSettings_networking_password"
              id="wifi_network_password"
              type={isShowPassword ? 'text' : 'password'}
              value={wifiPassword}
              // onChange={null}
            />
            <Flex marginTop={SPACING.spacing4}>
              <CheckboxField
                name="show_wifi_password"
                value={isShowPassword}
                onChange={() => setIsShowPassword(!isShowPassword)}
                label={t('wireless_slideout_show_password')}
              />
            </Flex>
          </>
        )}
      </Flex>
    </Slideout>
  )
}
