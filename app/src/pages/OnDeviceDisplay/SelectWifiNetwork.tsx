import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { css } from 'styled-components'

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
  Btn,
  COLORS,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'
import * as Networking from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'
import { SearchNetwork } from '../../organisms/SetupNetwork/SearchNetwork'

import type { State, Dispatch } from '../../redux/types'

const LIST_REFRESH_MS = 10000

const NETWORK_ROW_STYLE = css`
  &:active {
    background-color: ${COLORS.blueEnabled};
  }
`

export function SelectWifiNetwork(): JSX.Element {
  const { t } = useTranslation('device_settings')
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
            <Btn
              backgroundColor="#d6d6d6"
              key={nw.ssid}
              width="59rem"
              height="4rem"
              borderRadius="12px"
              marginBottom={SPACING.spacing3}
            >
              <Flex
                flexDirection={DIRECTION_ROW}
                padding={SPACING.spacing4}
                alignItems={ALIGN_CENTER}
                onClick={() =>
                  history.push(`/network-setup/wifi/set-wifi-cred/${nw.ssid}`)
                }
              >
                <Icon
                  name="wifi"
                  size="2.25rem"
                  color={COLORS.darkGreyEnabled}
                />
                <StyledText
                  marginLeft={SPACING.spacing4}
                  fontSize="1.5rem"
                  lineHeight="2.0625rem"
                  fontWeight="400"
                  color={COLORS.black}
                >
                  {nw.ssid}
                </StyledText>
              </Flex>
            </Btn>
          ))}
          <Btn
            onClick={() => history.push('/network-setup/wifi/set-wifi-ssid')}
            marginTop={SPACING.spacing3}
            width="59rem"
            height="4rem"
            backgroundColor="#d6d6d6"
            borderRadius="12px"
            css={NETWORK_ROW_STYLE}
          >
            <Flex
              padding={SPACING.spacing4}
              flexDirection={DIRECTION_ROW}
              alignItems={ALIGN_CENTER}
            >
              <Icon name="plus" size="2.25rem" color={COLORS.darkGreyEnabled} />
              <StyledText
                marginLeft={SPACING.spacingSM}
                color={COLORS.black}
                fontSize="1.5rem"
                lineHeight="1.8125rem"
                fontWeight="400"
              >
                {t('join_other_network')}
              </StyledText>
            </Flex>
          </Btn>
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
          {!isSearching ? null : (
            <Icon name="ot-spinner" size="3.3125rem" spin />
          )}
        </TertiaryButton>
      </Flex>
    </Flex>
  )
}
