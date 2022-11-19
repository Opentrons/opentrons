import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_FLEX_END,
  SPACING,
  Icon,
  COLORS,
  TYPOGRAPHY,
  JUSTIFY_START,
  ALIGN_CENTER,
  useInterval,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { SecondaryButton } from '../../atoms/buttons'
import {
  getNetworkInterfaces,
  fetchStatus,
  fetchWifiList,
} from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'

import type { State, Dispatch } from '../../redux/types'
import type { NavRouteParams } from '../../App/types'

const STATUS_REFRESH_MS = 5000
const LIST_REFRESH_MS = 10000

export function ConnectedNetworkInfo(): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { ssid } = useParams<NavRouteParams>()
  const dispatch = useDispatch<Dispatch>()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const { wifi } = useSelector((state: State) =>
    getNetworkInterfaces(state, robotName)
  )
  const history = useHistory()

  useInterval(() => dispatch(fetchStatus(robotName)), STATUS_REFRESH_MS, true)
  useInterval(() => dispatch(fetchWifiList(robotName)), LIST_REFRESH_MS, true)

  React.useEffect(() => {
    dispatch(fetchStatus(robotName))
    dispatch(fetchWifiList(robotName))
  }, [robotName, dispatch])

  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacingXXL}>
      <Flex justifyContent={JUSTIFY_START} marginBottom="3.125rem">
        <StyledText fontSize="2rem" fontWeight="700" lineHeight="2.72375">
          {'Set up your robot'}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingX={SPACING.spacing6}
        paddingY={SPACING.spacing5}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        backgroundColor={COLORS.darkGreyDisabled}
        marginBottom="13.1875rem"
        borderRadius="0.75rem"
      >
        <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
          <Icon name="wifi" size="2.4rem" />
          <StyledText
            marginLeft={SPACING.spacing2}
            fontSize="1.5rem"
            lineHeight="1.8rem"
            fontWeight="700"
          >
            {ssid}
          </StyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          textAlign={TYPOGRAPHY.textAlignRight}
          gridColumn={SPACING.spacing2}
        >
          <StyledText fontSize="1.5rem" lineHeight="1.8rem">
            {/* ToDo: if wifi is undefined no data or empty */}
            {`${t('ip_address')}:  ${String(wifi?.ipAddress)}`}
          </StyledText>
          <StyledText fontSize="1.5rem" lineHeight="1.8rem">
            {`${t('subnet_mask')}: ${String(wifi?.subnetMask)}`}
          </StyledText>
          <StyledText fontSize="1.5rem" lineHeight="1.8rem">
            {`${t('mac_address')}: ${String(wifi?.macAddress)}`}
          </StyledText>
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_FLEX_END}>
        <SecondaryButton onClick={() => history.push(`/select-wifi-network`)}>
          {t('change_network')}
        </SecondaryButton>
      </Flex>
    </Flex>
  )
}
