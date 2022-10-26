import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Flex,
  DIRECTION_COLUMN,
  useInterval,
  SPACING,
  ALIGN_CENTER,
  DIRECTION_ROW,
  Icon,
  COLORS,
  Btn,
} from '@opentrons/components'

import * as Networking from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'
// import { useRobot } from '../../organisms/Devices/hooks'

import type { State, Dispatch } from '../../redux/types'
import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'

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

  const handleConnect = (): void => {
    console.log('tapped')
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacingXXL}>
      <Flex alignItems={ALIGN_CENTER}>
        <StyledText>{'Connect to a network'}</StyledText>
        <TertiaryButton>{'Search again'}</TertiaryButton>
      </Flex>
      {/* <StyledText>{localRobot}</StyledText> */}
      {list.length > 0
        ? list.map(nw => (
            <Flex
              width="59rem"
              height="4rem"
              flexDirection={DIRECTION_ROW}
              padding={SPACING.spacing4}
              key={nw.ssid}
              backgroundColor="#d6d6d6"
              alignItems={ALIGN_CENTER}
              marginBottom={SPACING.spacing3}
              borderRadius="0.75rem"
            >
              <Icon name="wifi" size="2.25rem" />
              <StyledText marginLeft={SPACING.spacing4} color="#000">
                {nw.ssid}
              </StyledText>
            </Flex>
          ))
        : null}
    </Flex>
  )
}
