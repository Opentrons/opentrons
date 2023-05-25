import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import last from 'lodash/last'

import {
  Flex,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Icon,
  Btn,
  BORDERS,
  ALIGN_CENTER,
  DISPLAY_FLEX,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { NetworkDetailsModal } from './NetworkDetailsModal'
import {
  ConnectingNetwork,
  DisplayWifiList,
  FailedToConnect,
  SetWifiSsid,
  SelectAuthenticationType,
  SetWifiCred,
} from '../../../NetworkSettings'
import * as Networking from '../../../../redux/networking'
import * as RobotApi from '../../../../redux/robot-api'
import { getLocalRobot } from '../../../../redux/discovery'
import { fetchStatus, getNetworkInterfaces } from '../../../../redux/networking'
import { useWifiList } from '../../../../resources/networking/hooks'
import {
  CONNECT,
  JOIN_OTHER,
} from '../../../Devices/RobotSettings/ConnectNetwork/constants'

import type { WifiSecurityType } from '@opentrons/api-client'
import type { Dispatch, State } from '../../../../redux/types'
import type { RequestState } from '../../../../redux/robot-api/types'
import type { WifiNetwork } from '../../../../redux/networking/types'
import type { NetworkChangeState } from '../../../Devices/RobotSettings/ConnectNetwork/types'

const FETCH_WIFI_LIST_MS = 5000
interface WifiConnectionDetailsProps {
  ssid?: string
  authType?: string
}
export function WifiConnectionDetails({
  ssid,
  authType,
}: WifiConnectionDetailsProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])
  const [
    showNetworkDetailModal,
    setShowNetworkDetailModal,
  ] = React.useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const list = useWifiList(robotName, FETCH_WIFI_LIST_MS)
  const { wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const noData = i18n.format(t('shared:no_data'), 'titleCase')
  const ipAddress = wifi?.ipAddress != null ? wifi.ipAddress : noData
  const subnetMask = wifi?.subnetMask != null ? wifi.subnetMask : noData
  const macAddress = wifi?.macAddress != null ? wifi.macAddress : noData

  // ToDo (kj:05/24/2023) need to refactor
  const [selectedSsid, setSelectedSsid] = React.useState<string>('')
  const [
    showSelectAuthenticationType,
    setShowSelectAuthenticationType,
  ] = React.useState<boolean>(false)
  const [
    selectedAuthType,
    setSelectedAuthType,
  ] = React.useState<WifiSecurityType>('wpa-psk')
  const [changeState, setChangeState] = React.useState<NetworkChangeState>({
    type: null,
  })
  const [password, setPassword] = React.useState<string>('')
  const [dispatchApiRequest, requestIds] = RobotApi.useDispatchApiRequest()
  const requestState = useSelector((state: State) => {
    const lastId = last(requestIds)
    return lastId != null ? RobotApi.getRequestById(state, lastId) : null
  })
  const [
    currentRequestState,
    setCurrentRequestState,
  ] = React.useState<RequestState | null>(requestState)

  const handleConnect = (): void => {
    const options = {
      ssid: selectedSsid,
      securityType: selectedAuthType,
      hidden:
        selectedAuthType === 'none' ||
        (changeState.type === JOIN_OTHER && false),
      psk: password,
    }
    dispatchApiRequest(Networking.postWifiConfigure(robotName, options))
    // Note: kj 1/18/2023 for join_other network , this will be required by a following PR
    if (changeState.type === JOIN_OTHER) {
      setChangeState({ type: changeState.type, ssid: options.ssid })
    }
    setPassword('')
  }

  const renderScreen = (): JSX.Element | null => {
    if (changeState.type == null) {
      return null
    } else if (changeState.type === JOIN_OTHER && changeState.ssid === null) {
      return (
        <SetWifiSsid
          setSelectedSsid={setSelectedSsid}
          setShowSelectAuthenticationType={setShowSelectAuthenticationType}
          setChangeState={setChangeState}
        />
      )
    } else if (showSelectAuthenticationType) {
      return (
        <SelectAuthenticationType
          ssid={selectedSsid}
          fromWifiList={true}
          selectedAuthType={selectedAuthType}
          setShowSelectAuthenticationType={setShowSelectAuthenticationType}
          setSelectedAuthType={setSelectedAuthType}
          setChangeState={setChangeState}
        />
      )
      // This condition might be changed for manual connect
    } else if (changeState.ssid != null && currentRequestState === null) {
      return (
        <SetWifiCred
          ssid={changeState.ssid}
          setShowSelectAuthenticationType={setShowSelectAuthenticationType}
          authType={selectedAuthType}
          password={password}
          setPassword={setPassword}
          handleConnect={handleConnect}
        />
      )
    } else if (
      changeState.ssid != null &&
      currentRequestState !== null &&
      currentRequestState.status === RobotApi.PENDING
    ) {
      return <ConnectingNetwork ssid={changeState.ssid} />
    } else if (
      changeState.ssid != null &&
      currentRequestState !== null &&
      currentRequestState.status === RobotApi.SUCCESS
    ) {
      return (
        <WifiConnectionDetails
          ssid={changeState.ssid}
          authType={selectedAuthType}
        />
      )
    } else if (
      changeState.ssid != null &&
      currentRequestState !== null &&
      currentRequestState.status === RobotApi.FAILURE
    ) {
      return (
        <FailedToConnect
          ssid={changeState.ssid}
          requestState={currentRequestState}
          type={changeState.type}
          onConnect={handleConnect}
          setChangeState={setChangeState}
          setCurrentRequestState={setCurrentRequestState}
        />
      )
    } else {
      return null
    }
  }

  React.useEffect(() => {
    setCurrentRequestState(requestState)
  }, [requestState])

  React.useEffect(() => {
    // TODO kj 01/30/2023 This authType None will be fixed in a following PR
    // a user selects none as authType
    if (selectedSsid !== '' && selectedAuthType === 'none') {
      const network = list.find((nw: WifiNetwork) => nw.ssid === selectedSsid)
      if (network != null) {
        handleConnect()
        setChangeState({ type: CONNECT, ssid: selectedSsid, network })
      }
    }
  }, [selectedSsid, selectedAuthType, list])

  React.useEffect(() => {
    dispatch(fetchStatus(robotName))
  }, [robotName, dispatch])

  return (
    <>
      {showNetworkDetailModal ? (
        <NetworkDetailsModal
          ssid={ssid}
          setShowNetworkDetailModal={setShowNetworkDetailModal}
          ipAddress={ipAddress}
          subnetMask={subnetMask}
          macAddress={macAddress}
          securityType={authType}
        />
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN}>
        {renderScreen()}
        {ssid != null ? (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            marginBottom={SPACING.spacing40}
          >
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.darkBlack70}
            >
              {t('connected_network')}
            </StyledText>
            <Btn
              display={DISPLAY_FLEX}
              width="100%"
              padding={SPACING.spacing24}
              backgroundColor={COLORS.green3}
              borderRadius={BORDERS.size3}
              onClick={() => setShowNetworkDetailModal(true)}
              alignItems={ALIGN_CENTER}
            >
              <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing24}>
                <Flex gridGap={SPACING.spacing8} width="34.8125rem">
                  <Flex alignItems={ALIGN_CENTER} gridGap={SPACING.spacing4}>
                    <Icon
                      name="wifi"
                      size="2.5rem"
                      aria-label={`${ssid}_wifi_icon`}
                    />
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      gridGap={SPACING.spacing2}
                    >
                      <StyledText as="h4" textAlign={TYPOGRAPHY.textAlignLeft}>
                        {ssid}
                      </StyledText>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex
                  alignItems={ALIGN_CENTER}
                  flexDirection={DIRECTION_ROW}
                  gridGap={SPACING.spacing12}
                >
                  <Icon
                    size="2.5rem"
                    name="info"
                    aria-label={`${ssid}_info_icon`}
                  />
                  <StyledText
                    as="p"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                    color={COLORS.darkBlack70}
                  >
                    {t('view_details')}
                  </StyledText>
                </Flex>
              </Flex>
            </Btn>
          </Flex>
        ) : null}
        {ssid != null ? (
          <StyledText
            as="p"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            color={COLORS.darkBlack70}
          >
            {t('other_networks')}
          </StyledText>
        ) : null}
        {changeState.type == null ? (
          <DisplayWifiList
            list={list}
            setShowSelectAuthenticationType={setShowSelectAuthenticationType}
            setChangeState={setChangeState}
            setSelectedSsid={setSelectedSsid}
          />
        ) : null}
      </Flex>
    </>
  )
}
