import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import last from 'lodash/last'
import {
  Flex,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  Icon,
  useInterval,
} from '@opentrons/components'
import { getRequestById, useDispatchApiRequest } from '../../redux/robot-api'
import { fetchWifiList } from '../../redux/networking'
import { getLocalRobot } from '../../redux/discovery'
import { StyledText } from '../../atoms/text'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'

import type { NavRouteParams } from '../../App/types'
import type { State, Dispatch } from '../../redux/types'

const LIST_REFRESH_MS = 10000

interface ConnectionResultProps {
  isConnected: boolean
}

export function ConnectionResult({
  isConnected,
}: ConnectionResultProps): JSX.Element {
  const { ssid } = useParams<NavRouteParams>()
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const [dispatchApi, requestIds] = useDispatchApiRequest()
  const requestState = useSelector((state: State) => {
    const lastId = last(requestIds)
    return lastId != null ? getRequestById(state, lastId) : null
  })

  useInterval(
    () => {
      dispatch(fetchWifiList(robotName))
    },
    LIST_REFRESH_MS,
    true
  )

  // ToDo use isConnected for rendering parts
  return (
    <>
      {isConnected ? (
        <Flex padding={SPACING.spacingXXL} flexDirection={DIRECTION_COLUMN}>
          <Flex justifyContent={JUSTIFY_CENTER}>
            <StyledText
              fontSize="2rem"
              fontWeight="700"
              lineHeight="2.72375rem"
            >
              {'Connect to a network'}
            </StyledText>
          </Flex>
          <Flex
            height="26.5625rem"
            backgroundColor={COLORS.successBackgroundMed}
            justifyContent={JUSTIFY_CENTER}
            marginBottom={SPACING.spacing6}
          >
            <Flex
              justifyContent={JUSTIFY_CENTER}
              alignItems={ALIGN_CENTER}
              flexDirection={DIRECTION_COLUMN}
            >
              <Icon
                name="ot-check"
                size="4.375rem"
                color={COLORS.successEnabled}
                aria-label="spinner"
              />
              <StyledText
                fontSize="2rem"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                lineHeight="2.72375rem"
                marginTop={SPACING.spacingXXL}
              >
                {`Connected to ${ssid}`}
              </StyledText>
            </Flex>
          </Flex>
          <Flex gridRow="0.75rem">
            <SecondaryButton
              flex="1"
              onClick={() => history.push(`/selectNetwork`)}
            >
              {'Change network'}
            </SecondaryButton>
            <PrimaryButton
              flex="1"
              onClick={() => history.push(`/connectedNetworkInfo/${ssid}`)}
            >
              {'Done'}
            </PrimaryButton>
          </Flex>
        </Flex>
      ) : (
        <Flex padding={SPACING.spacingXXL} flexDirection={DIRECTION_COLUMN}>
          <Flex justifyContent={JUSTIFY_CENTER}>
            <StyledText
              fontSize="2rem"
              fontWeight="700"
              lineHeight="2.72375rem"
            >
              {'Connect to a network'}
            </StyledText>
          </Flex>
          <Flex
            height="26.5625rem"
            backgroundColor={COLORS.errorBackgroundMed}
            justifyContent={JUSTIFY_CENTER}
            marginBottom={SPACING.spacing6}
          >
            <Flex
              justifyContent={JUSTIFY_CENTER}
              alignItems={ALIGN_CENTER}
              flexDirection={DIRECTION_COLUMN}
            >
              <Icon
                name="ot-alert"
                size="4.375rem"
                color={COLORS.errorEnabled}
                aria-label="spinner"
              />
              <StyledText
                fontSize="2rem"
                fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                lineHeight="2.72375rem"
                marginTop={SPACING.spacingXXL}
              >
                {`Connected to ${ssid}`}
              </StyledText>
            </Flex>
          </Flex>
          <Flex gridRow="0.75rem">
            <SecondaryButton
              flex="1"
              onClick={() => console.log('need to call connect again')}
            >
              {'Try again'}
            </SecondaryButton>
            <PrimaryButton
              flex="1"
              onClick={() => history.push(`/selectNetwork`)}
            >
              {'Change network'}
            </PrimaryButton>
          </Flex>
        </Flex>
      )}
    </>
  )
}
