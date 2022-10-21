import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Flex, DIRECTION_COLUMN, useInterval } from '@opentrons/components'

import * as Networking from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'
// import { useRobot } from '../../organisms/Devices/hooks'

import type { State, Dispatch } from '../../redux/types'
import { StyledText } from '../../atoms/text'

const LIST_REFRESH_MS = 10000

export function SelectNetwork(): JSX.Element {
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name ? localRobot.name : 'no name'
  const dispatch = useDispatch<Dispatch>()
  const list = useSelector((state: State) =>
    Networking.getWifiList(state, robotName)
  )

  console.log('localRobot', localRobot)
  console.log('wifi network list', list)

  useInterval(
    () => dispatch(Networking.fetchWifiList(robotName)),
    LIST_REFRESH_MS,
    true
  )

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {/* <StyledText>{localRobot}</StyledText> */}
      <StyledText>{robotName}</StyledText>
      <StyledText>{'network list'}</StyledText>
      {list.map(nw => (
        <Flex key={nw.ssid}>{nw.ssid}</Flex>
      ))}
    </Flex>
  )
}
