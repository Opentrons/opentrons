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
} from '@opentrons/components'

import { getWifiList, fetchWifiList } from '../../../redux/networking'
import { Slideout } from '../../../atoms/Slideout'
import { PrimaryButton } from '../../../atoms/Buttons'
import { StyledText } from '../../../atoms/text'
import { InputField } from '../../../atoms/InputField'

import type { State, Dispatch } from '../../../redux/types'
import type { WifiNetwork } from '../../../redux/networking'
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
  const [
    selectedNetwork,
    setSelectedNetwork,
  ] = React.useState<WifiNetwork | null>(null)
  const [wifiPassword, setWifiPassword] = React.useState<string | null>(null)
  const selectedItem = true // dummy
  const dispatch = useDispatch<Dispatch>()

  // Todo
  // when a user selects a wifi network, show a textbox for password
  // and activate the connect to network button
  // when a use clicks the connect to network button, close the slideout immediately
  // if a user selects a wifi that its securityType is none not show the password textbox and checkbox

  // when a user clicks the connect to wifi button, dispatch a request to connect to wifi

  const list = useSelector((state: State) => getWifiList(state, robotName))
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

  useInterval(() => dispatch(fetchWifiList(robotName)), LIST_REFRESH_MS, true)

  return (
    <Slideout
      title={t('wireless_network_connect')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height="100%"
      footer={
        <PrimaryButton disabled={selectedItem} onClick={null} width="100%">
          {t('wireless_connect_button')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p">{t('wireless_slideout_network_name')}</StyledText>
        <Flex>
          <DropdownField
            options={networkOptions}
            onChange={handleChange}
            value={selectedNetwork}
            id={`RobotSettings_networking_${robotName}`}
          />
        </Flex>
        {list.find(network => network?.ssid === selectedNetwork)
          ?.securityType === 'none' && (
          <InputField
            data-testid="RobotSettings_networking_password"
            id="wifi_network_password"
            type="password"
            value={wifiPassword}
            // onChange={null}
          />
        )}
      </Flex>
    </Slideout>
  )
}
