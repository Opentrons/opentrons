import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { css } from 'styled-components'

import {
  Flex,
  SPACING,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  Icon,
  Btn,
  JUSTIFY_START,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  DISPLAY_FLEX,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/constants'
import { DisplaySearchNetwork } from './DisplaySearchNetwork'
import {
  CONNECT,
  JOIN_OTHER,
} from '../Devices/RobotSettings/ConnectNetwork/constants'

import type { WifiNetwork } from '../../redux/networking/types'
import type { NetworkChangeState } from '../Devices/RobotSettings/ConnectNetwork/types'

const NETWORK_ROW_STYLE = css`
  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.light1};
    color: ${COLORS.darkBlack100};
  }

  &:focus {
    background-color: ${COLORS.light1Pressed};
    color: ${COLORS.darkBlack100};
    box-shadow: none;
  }
  &:active {
    background-color: ${COLORS.light1Pressed};
    color: ${COLORS.darkBlack100};
  }
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
  }
  &:disabled {
    color: ${COLORS.darkBlack60};
  }
`

interface DisplayWifiListProps {
  list: WifiNetwork[]
  setShowSelectAuthenticationType: (
    isShowSelectAuthenticationType: boolean
  ) => void
  setChangeState: (changeState: NetworkChangeState) => void
  setSelectedSsid: (selectedSsid: string) => void
}

export function DisplayWifiList({
  list,
  setShowSelectAuthenticationType,
  setChangeState,
  setSelectedSsid,
}: DisplayWifiListProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const [isSearching, setIsSearching] = React.useState<boolean>(false)

  const handleClick = (nw: WifiNetwork): void => {
    setShowSelectAuthenticationType(true)
    setSelectedSsid(nw.ssid)
    setChangeState({ type: CONNECT, ssid: nw.ssid, network: nw })
  }
  const hasSsid = list != null && list.length > 0

  // ToDo (kj:05/23/2023) This spinner part will be fixed later (talked with the designer)
  React.useEffect(() => {
    setIsSearching(true)
    const checkUpdateTimer = setTimeout(() => {
      setIsSearching(false)
    }, 3000)
    return () => {
      clearTimeout(checkUpdateTimer)
    }
  }, [list])

  return (
    <>
      <HeaderWithIPs isSearching={isSearching} hasSsid={hasSsid} />
      {list != null && list.length > 0
        ? list.map(nw => (
            <Btn
              display={DISPLAY_FLEX}
              width="100%"
              height="5rem"
              key={nw.ssid}
              backgroundColor={COLORS.light1}
              marginBottom={SPACING.spacing8}
              borderRadius={BORDERS.size3}
              css={NETWORK_ROW_STYLE}
              flexDirection={DIRECTION_ROW}
              padding={`${SPACING.spacing20} ${SPACING.spacing32}`}
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing4}
              onClick={() => handleClick(nw)}
            >
              <Icon name="wifi" size="2.5rem" />
              <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightRegular}>
                {nw.ssid}
              </StyledText>
            </Btn>
          ))
        : null}
      <Btn
        display="flex"
        onClick={() => setChangeState({ type: JOIN_OTHER, ssid: null })}
        height="5rem"
        backgroundColor={COLORS.light1}
        borderRadius={BORDERS.size4}
        color={COLORS.black}
        css={NETWORK_ROW_STYLE}
        padding={`${SPACING.spacing20} ${SPACING.spacing32}`}
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing4}
      >
        <Icon name="plus" size="2.5rem" color={COLORS.darkBlack100} />
        <StyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightRegular}>
          {t('join_other_network')}
        </StyledText>
      </Btn>
      {list != null && list.length > 0 ? null : <DisplaySearchNetwork />}
    </>
  )
}

interface HeadWithIPsProps {
  isSearching: boolean
  hasSsid: boolean
}

const HeaderWithIPs = ({
  isSearching,
  hasSsid,
}: HeadWithIPsProps): JSX.Element => {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      alignItems={ALIGN_CENTER}
      marginBottom="3.0625rem"
      flex="1"
    >
      <Flex justifyContent={JUSTIFY_START} flex="1">
        <Btn
          onClick={() => history.push('/network-setup')}
          data-testid="back-button"
        >
          <Flex flexDirection={DIRECTION_ROW}>
            <Icon
              name="back"
              marginRight={SPACING.spacing2}
              size="3rem"
              color={COLORS.darkBlack100}
            />
          </Flex>
        </Btn>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} flex="2">
        <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {hasSsid ? t('choose_a_network') : t('select_a_network')}
        </StyledText>
      </Flex>
      <Flex justifyContent={JUSTIFY_END} flex="1">
        {isSearching ? (
          <Icon
            name="ot-spinner"
            spin
            size="3rem"
            data-testid="wifi_list_search_spinner"
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
