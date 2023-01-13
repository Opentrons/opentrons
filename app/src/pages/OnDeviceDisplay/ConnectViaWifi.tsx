import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  Flex,
  DIRECTION_COLUMN,
  useInterval,
  SPACING,
} from '@opentrons/components'

import { StepMeter } from '../../atoms/StepMeter'
import * as Networking from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'
import { DisplayWifiList } from '../../organisms/SetupNetwork/DisplayWifiList'
import { SelectAuthenticationType } from '../../organisms/SetupNetwork/SelectAuthenticationType'
import { SetWifiCred } from '../../organisms/SetupNetwork/SetWifiCred'

import type { State, Dispatch } from '../../redux/types'

const LIST_REFRESH_MS = 10000

export function ConnectViaWifi(): JSX.Element {
  const [isSearching, setIsSearching] = React.useState<boolean>(true)
  const [
    isShowSelectAuthenticationType,
    setIsShowSelectAuthenticationType,
  ] = React.useState<boolean>(false)
  const [isShowSetWifiCred, setIsShowSetWifiCred] = React.useState<boolean>(
    false
  )
  const [selectedSsid, setSelectedSsid] = React.useState<string>('')
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const dispatch = useDispatch<Dispatch>()
  const list = useSelector((state: State) =>
    Networking.getWifiList(state, robotName)
  )

  React.useEffect(() => {
    dispatch(Networking.fetchWifiList(robotName))
  }, [dispatch, robotName])

  useInterval(
    () => dispatch(Networking.fetchWifiList(robotName)),
    LIST_REFRESH_MS,
    true
  )

  React.useEffect(() => {
    if (list.length >= 1) {
      setIsSearching(false)
    }
  }, [list])

  return (
    <>
      <StepMeter totalSteps={5} currentStep={2} OnDevice />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${String(SPACING.spacing6)} ${String(
          SPACING.spacingXXL
        )} ${String(SPACING.spacingXXL)}`}
      >
        {isShowSelectAuthenticationType ? (
          <SelectAuthenticationType
            ssid={selectedSsid}
            fromWifiList={true}
            setIsShowSelectAuthenticationType={
              setIsShowSelectAuthenticationType
            }
            setIsShowSetWifiCred={setIsShowSetWifiCred}
          />
        ) : isShowSetWifiCred ? (
          <SetWifiCred
            ssid={selectedSsid}
            setIsShowSetWifiCred={setIsShowSetWifiCred}
          />
        ) : (
          <DisplayWifiList
            list={list}
            isSearching={isSearching}
            setSelectedSsid={setSelectedSsid}
            setIsShowSelectAuthenticationType={
              setIsShowSelectAuthenticationType
            }
          />
        )}
      </Flex>
    </>
  )
}
