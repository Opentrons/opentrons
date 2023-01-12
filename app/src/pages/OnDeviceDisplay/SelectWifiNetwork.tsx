import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Flex,
  DIRECTION_COLUMN,
  useInterval,
  SPACING,
  ALIGN_CENTER,
  DIRECTION_ROW,
  Icon,
  JUSTIFY_CENTER,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import * as Networking from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'
import { SearchNetwork } from '../../organisms/SetupNetwork/SearchNetwork'
import { SetWifiCred } from '../../organisms/SetupNetwork/SetWifiCred'

import type { State, Dispatch } from '../../redux/types'

const LIST_REFRESH_MS = 10000

export function SelectWifiNetwork(): JSX.Element {
  const [isSearching, setIsSearching] = React.useState<boolean>(false)
  const [isShowSetWifiCred, setIsShowSetWifiCred] = React.useState<boolean>(
    false
  )
  const [selectedSsid, setSelectedSsid] = React.useState<string>('')
  const [requiredRerender, setRequiredRerender] = React.useState<boolean>(false)
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

  const handleSearch = (): void => {
    setIsSearching(true)
    dispatch(Networking.fetchWifiList(robotName))
  }

  console.log('requiredRerender', requiredRerender)
  // const handleShowSetWifiCred = (isShow: boolean): void => {
  //   console.log('called: isShow', isShow)
  //   setIsShowSetWifiCred(isShow)
  // }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={`${String(SPACING.spacing6)} ${String(
        SPACING.spacingXXL
      )} ${String(SPACING.spacingXXL)}`}
    >
      {isShowSetWifiCred ? (
        <SetWifiCred
          ssid={selectedSsid}
          setIsShowSetWifiCred={setIsShowSetWifiCred}
          setRequiredRerender={setRequiredRerender}
        />
      ) : null}
      {list.length >= 1 ? (
        <>
          <HeaderWithIPs
            handleSearch={handleSearch}
            isSearching={isSearching}
          />
          {list.map(nw => (
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
              onClick={() => {
                setSelectedSsid(nw.ssid)
                setIsShowSetWifiCred(true)
              }}
            >
              <Icon name="wifi" size="2.25rem" />
              <StyledText marginLeft={SPACING.spacing4} color="#000">
                {nw.ssid}
              </StyledText>
            </Flex>
          ))}
        </>
      ) : (
        <SearchNetwork />
      )}
    </Flex>
  )
}

interface HeadWithIPsProps {
  handleSearch: () => void
  isSearching: boolean
}

const HeaderWithIPs = ({
  handleSearch,
  isSearching,
}: HeadWithIPsProps): JSX.Element => {
  const { t } = useTranslation('device_settings')
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      marginBottom="3.041875rem"
    >
      <Flex>
        <StyledText fontSize="2rem" fontWeight="700" lineHeight="2.72375rem">
          {t('connect_to_a_network')}
        </StyledText>
      </Flex>
    </Flex>
  )
}
