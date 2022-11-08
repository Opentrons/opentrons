import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  useInterval,
  SPACING,
  ALIGN_CENTER,
  DIRECTION_ROW,
  Icon,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'
import * as Networking from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'
import { SearchNetwork } from './SearchNetwork'

import type { State, Dispatch } from '../../redux/types'

const LIST_REFRESH_MS = 10000

export function SelectNetwork(): JSX.Element {
  const [isSearching, setIsSearching] = React.useState<boolean>(false)
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const dispatch = useDispatch<Dispatch>()
  const list = useSelector((state: State) =>
    Networking.getWifiList(state, robotName)
  )
  const history = useHistory()

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

  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacingXXL}>
      {list.length > 0 ? (
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
              onClick={() => history.push(`/setWifiCred/${nw.ssid}`)}
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
      position={POSITION_RELATIVE}
      marginBottom="3.041875rem"
    >
      <Flex>
        <StyledText fontSize="2rem" fontWeight="700" lineHeight="2.72375rem">
          {t('connect_to_a_network')}
        </StyledText>
      </Flex>

      <Flex position={POSITION_ABSOLUTE} right="0">
        <TertiaryButton
          width="11.8125rem"
          height="3.75rem"
          fontSize="1.5rem"
          fontWeight="500"
          lineHeight="2.0425rem"
          onClick={handleSearch}
        >
          {!isSearching ? t('search_again') : t('searching')}
        </TertiaryButton>
      </Flex>
    </Flex>
  )
}
