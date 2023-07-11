import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/constants'
import { RobotSetupHeader } from '../../organisms/RobotSetupHeader'
import { DisplaySearchNetwork } from './DisplaySearchNetwork'

import type { WifiNetwork } from '../../redux/networking/types'

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
  handleJoinAnotherNetwork: () => void
  handleNetworkPress: (ssid: string) => void
  isHeader?: boolean
}

export function DisplayWifiList({
  list,
  handleJoinAnotherNetwork,
  handleNetworkPress,
  isHeader = false,
}: DisplayWifiListProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const history = useHistory()

  return (
    <>
      {isHeader ? (
        <RobotSetupHeader
          header={t('select_a_network')}
          onClickBack={() => history.push('/network-setup')}
        />
      ) : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        // padding for robot setup
        padding={isHeader ? SPACING.spacing60 : SPACING.spacing40}
        paddingTop={isHeader ? SPACING.spacing32 : '0'}
      >
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
                onClick={() => handleNetworkPress(nw.ssid)}
              >
                <Icon name="wifi" size="2.5rem" />
                <StyledText as="h4">{nw.ssid}</StyledText>
              </Btn>
            ))
          : null}
        <Btn
          display="flex"
          onClick={handleJoinAnotherNetwork}
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
      </Flex>
    </>
  )
}
