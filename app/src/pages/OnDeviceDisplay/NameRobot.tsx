import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { css } from 'styled-components'
import { useFormik } from 'formik'

import {
  Box,
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  SPACING,
  Btn,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_FIXED,
  JUSTIFY_CENTER,
  TEXT_ALIGN_RIGHT,
} from '@opentrons/components'

import {
  removeRobot,
  getConnectableRobots,
  getReachableRobots,
  getUnreachableRobots,
  getLocalRobot,
} from '../../redux/discovery'

import { useTrackEvent } from '../../redux/analytics'

import { StyledText } from '../../atoms/text'
import { InputField } from '../../atoms/InputField'
import { CustomKeyboard } from '../../atoms/SoftwareKeyboard'
import { TertiaryButton } from '../../atoms/buttons'

import type { UpdatedRobotName } from '@opentrons/api-client'
import type { State, Dispatch } from '../../redux/types'
import type { NavRouteParams } from '../../App/types'

export function NameRobot(): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const trackEvent = useTrackEvent()
  const keyboardRef = React.useRef(null)
  const localRobot = useSelector(getLocalRobot)
  const [name, setName] = React.useState<string>(
    localRobot?.name ? localRobot.name : ''
  )
  const history = useHistory()
  const dispatch = useDispatch<Dispatch>()
  const connectableRobots = useSelector((state: State) =>
    getConnectableRobots(state)
  )
  const reachableRobots = useSelector((state: State) =>
    getReachableRobots(state)
  )
  const unreachableRobot = useSelector((state: State) =>
    getUnreachableRobots(state)
  )

  const handleConfirm = (): void => {
    // check robot name in the same network
    console.log('clicked confirm button')
  }

  console.log(connectableRobots)
  console.log(reachableRobots)
  console.log(unreachableRobot)

  return (
    <Flex flexDirection={DIRECTION_COLUMN} margin={SPACING.spacingXXL}>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        // justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        marginBottom="2rem"
        flex="2 1"
      >
        <Flex>
          <StyledText fontSize="2rem" lineHeight="2.75rem" fontWeight="700">
            {t('name_your_robot')}
          </StyledText>
        </Flex>
        <Flex>
          <TertiaryButton
            width="8.9375rem"
            height="3.75rem"
            fontSize="1.5rem"
            fontWeight="500"
            lineHeight="2.0425rem"
            onClick={handleConfirm}
          >
            {t('shared:confirm')}
          </TertiaryButton>
        </Flex>
      </Flex>

      <Flex
        width="100%"
        flexDirection={DIRECTION_COLUMN}
        paddingLeft="6.25rem"
        alignItems={ALIGN_CENTER}
      >
        <StyledText marginBottom="0.75rem">
          {t('name_your_robot_description')}
        </StyledText>
        <Flex flexDirection={DIRECTION_ROW}>
          <Box width="36.375rem"></Box>
        </Flex>
        <StyledText marginBottom="0.75rem">
          {t('name_rule_description')}
        </StyledText>
      </Flex>

      <Flex width="100%" position={POSITION_FIXED} left="0" bottom="0">
        <CustomKeyboard
          onChange={e => e != null && setName(String(e))}
          keyboardRef={keyboardRef}
        />
      </Flex>
    </Flex>
  )
}
