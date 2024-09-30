import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
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
  LegacyStyledText,
} from '@opentrons/components'

import { ODD_FOCUS_VISIBLE } from '/app/atoms/buttons/constants'
import { RobotSetupHeader } from '/app/organisms/ODD/RobotSetupHeader'
import { DisplaySearchNetwork } from './DisplaySearchNetwork'

import type { WifiNetwork } from '/app/redux/networking/types'

const NETWORK_ROW_STYLE = css`
  display: ${DISPLAY_FLEX};
  width: 100%;
  height: 5rem;
  padding: ${SPACING.spacing20} ${SPACING.spacing32};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing16};

  background-color: ${COLORS.grey35};
  margin-bottom: ${SPACING.spacing8};
  border-radius: ${BORDERS.borderRadius16};

  &:hover {
    border: none;
    box-shadow: none;
    background-color: ${COLORS.grey35};
    color: ${COLORS.black90};
  }

  &:focus {
    background-color: ${COLORS.grey40};
    color: ${COLORS.black90};
    box-shadow: none;
  }
  &:active {
    background-color: ${COLORS.grey40};
    color: ${COLORS.black90};
  }
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
  }
  &:disabled {
    color: ${COLORS.grey50};
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
  const navigate = useNavigate()

  return (
    <>
      {isHeader ? (
        <RobotSetupHeader
          header={t('select_a_network')}
          onClickBack={() => {
            navigate('/network-setup')
          }}
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
                key={nw.ssid}
                css={NETWORK_ROW_STYLE}
                flexDirection={DIRECTION_ROW}
                onClick={() => {
                  handleNetworkPress(nw.ssid)
                }}
              >
                <Icon name="wifi" size="2.5rem" />
                <LegacyStyledText as="h4">{nw.ssid}</LegacyStyledText>
              </Btn>
            ))
          : null}
        <Btn
          display="flex"
          onClick={handleJoinAnotherNetwork}
          height="5rem"
          backgroundColor={COLORS.grey35}
          borderRadius={BORDERS.borderRadius16}
          color={COLORS.black90}
          css={NETWORK_ROW_STYLE}
          padding={`${SPACING.spacing20} ${SPACING.spacing32}`}
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing4}
        >
          <Icon name="plus" size="2.5rem" color={COLORS.black90} />
          <LegacyStyledText as="h4">{t('join_other_network')}</LegacyStyledText>
        </Btn>
        {list != null && list.length > 0 ? null : <DisplaySearchNetwork />}
      </Flex>
    </>
  )
}
