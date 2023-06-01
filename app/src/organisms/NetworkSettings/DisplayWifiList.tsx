import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  Btn,
  COLORS,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_START,
  SPACING,
  TYPOGRAPHY,
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
  isHeader?: boolean
}

export function DisplayWifiList({
  list,
  setShowSelectAuthenticationType,
  setChangeState,
  setSelectedSsid,
  isHeader = false,
}: DisplayWifiListProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  const handleClick = (nw: WifiNetwork): void => {
    setShowSelectAuthenticationType(true)
    setSelectedSsid(nw.ssid)
    setChangeState({ type: CONNECT, ssid: nw.ssid, network: nw })
  }

  return (
    <>
      {isHeader ? <HeaderWithIPs /> : null}
      {list != null && list.length > 0
        ? list.map(nw => (
            <Btn
              display={DISPLAY_FLEX}
              width="100%"
              height="5rem"
              key={nw.ssid}
              backgroundColor={COLORS.light1}
              marginBottom={SPACING.spacing8}
              borderRadius={BORDERS.borderRadiusSize3}
              css={NETWORK_ROW_STYLE}
              flexDirection={DIRECTION_ROW}
              padding={`${SPACING.spacing20} ${SPACING.spacing32}`}
              alignItems={ALIGN_CENTER}
              gridGap={SPACING.spacing4}
              onClick={() => handleClick(nw)}
            >
              <Icon name="wifi" size="2.5rem" />
              <StyledText as="h4">{nw.ssid}</StyledText>
            </Btn>
          ))
        : null}
      <Btn
        display="flex"
        onClick={() => setChangeState({ type: JOIN_OTHER, ssid: null })}
        height="5rem"
        backgroundColor={COLORS.light1}
        borderRadius={BORDERS.borderRadiusSize4}
        color={COLORS.black}
        css={NETWORK_ROW_STYLE}
        padding={`${SPACING.spacing20} ${SPACING.spacing32}`}
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing4}
      >
        <Icon name="plus" size="2.5rem" color={COLORS.darkBlack100} />
        <StyledText as="h4">{t('join_other_network')}</StyledText>
      </Btn>
      {list != null && list.length > 0 ? null : <DisplaySearchNetwork />}
    </>
  )
}

const HeaderWithIPs = (): JSX.Element => {
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
          {t('select_a_network')}
        </StyledText>
      </Flex>
      <Box flex="1" />
    </Flex>
  )
}
