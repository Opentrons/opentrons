import * as React from 'react'
import { useSelector } from 'react-redux'
import { useParams, useHistory } from 'react-router-dom'
import last from 'lodash/last'
import { css } from 'styled-components'

import {
  Box,
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  SPACING,
  Icon,
  Btn,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_CENTER,
  POSITION_FIXED,
  JUSTIFY_START,
  JUSTIFY_FLEX_START,
} from '@opentrons/components'

import * as RobotApi from '../../redux/robot-api'
import * as Networking from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'
import {
  CONNECT,
  DISCONNECT,
  JOIN_OTHER,
} from '../Devices/RobotSettings/ConnectNetwork/constants'
import { StyledText } from '../../atoms/text'
import { InputField } from '../../atoms/InputField'
import { NormalKeyboard } from '../../atoms/SoftwareKeyboard'

import type { State } from '../../redux/types'
import type { NavRouteParams } from '../../App/types'
import type {
  NetworkChangeState,
  WifiConfigureRequest,
  WifiEapConfig,
} from '../Devices/RobotSettings/ConnectNetwork/types'
import { TertiaryButton } from '../../atoms/buttons'

export function SetWifiCred(): JSX.Element {
  const { ssid } = useParams<NavRouteParams>()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const keyboardRef = React.useRef(null)
  const [password, setPassword] = React.useState<string>('')
  const [showPassword, setShowPassword] = React.useState<boolean>(false)
  const [changeState, setChangeState] = React.useState<NetworkChangeState>({
    type: null,
  })
  const [dispatchApi, requestIds] = RobotApi.useDispatchApiRequest()
  const requestState = useSelector((state: State) => {
    const lastId = last(requestIds)
    return lastId != null ? RobotApi.getRequestById(state, lastId) : null
  })
  const history = useHistory()

  // get WifiNetwork by the ssid
  const list = useSelector((state: State) =>
    Networking.getWifiList(state, robotName)
  )
  const selectedNetwork = list.find(nw => nw.ssid === ssid)

  const formatNetworkSettings = (): WifiConfigureRequest => {
    const securityType = selectedNetwork?.securityType
    const hidden = false // Need to update for manual connecting process
    const psk = password

    return {
      ssid,
      securityType,
      hidden,
      psk,
    }
  }

  const handleConnect = (): void => {
    const options = formatNetworkSettings()
    dispatchApi(Networking.postWifiConfigure(robotName, options))
    if (changeState.type === JOIN_OTHER) {
      setChangeState({ ...changeState, ssid: options.ssid })
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} margin={SPACING.spacingXXL}>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        marginBottom="3.0625rem"
      >
        <Btn onClick={() => history.push(`/selectNetwork`)}>
          <Flex flexDirection={DIRECTION_ROW}>
            <Icon
              name="arrow-back"
              marginRight={SPACING.spacing2}
              size="1.875rem"
            />
            <StyledText
              fontSize="1.625rem"
              lineHeight="2.1875rem"
              fontWeight="700"
            >
              {'Back'}
            </StyledText>
          </Flex>
        </Btn>
        <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
          {`${ssid}`}
        </StyledText>
        <TertiaryButton
          width="8.9375rem"
          height="3.75rem"
          fontSize="1.5rem"
          fontWeight="500"
          lineHeight="2.0425rem"
          onClick={handleConnect}
        >
          {'Connect'}
        </TertiaryButton>
      </Flex>

      <Flex width="100%" flexDirection={DIRECTION_COLUMN} paddingLeft="6.25rem">
        <StyledText marginBottom="0.75rem">{'Enter password'}</StyledText>
        <Flex flexDirection={DIRECTION_ROW}>
          {/* ToDo
        error case 1 not securityType none check input length if zero, show enter password */}
          <Box width="36.375rem">
            <InputField
              data-testid="Set_WiFi_password"
              value={password}
              type={showPassword ? 'text' : 'password'}
              height="3.875rem"
              css={css`
                font-size: 1.25rem;
              `}
            />
          </Box>

          <Btn
            marginLeft="1.5rem"
            onClick={() => setShowPassword(currentState => !currentState)}
          >
            <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
              <Icon
                name={showPassword ? 'eye-slash' : 'eye'}
                width="2.75rem"
                height="1.875rem"
              />
              <StyledText marginLeft={SPACING.spacing4}>
                {showPassword ? 'Hide' : 'Show'}
              </StyledText>
            </Flex>
          </Btn>
        </Flex>
      </Flex>

      <Flex width="100%" position={POSITION_FIXED} left="0" bottom="0">
        <NormalKeyboard
          onChange={e => e != null && setPassword(String(e))}
          keyboardRef={keyboardRef}
        />
      </Flex>
    </Flex>
  )
}
