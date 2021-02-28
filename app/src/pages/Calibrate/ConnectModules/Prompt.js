// @flow
// prompt for ReviewModulesModal of labware calibration page
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { push } from 'connected-react-router'

import {
  useHoverTooltip,
  Tooltip,
  LightSecondaryBtn,
  Text,
  SPACING_3,
  Flex,
  FONT_SIZE_BODY_2,
  FONT_SIZE_HEADER,
  C_WHITE,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  SIZE_3,
  FONT_WEIGHT_SEMIBOLD,
  TEXT_ALIGN_CENTER,
  SPACING_2,
  SPACING_4,
} from '@opentrons/components'

import { selectors as robotSelectors } from '../../../redux/robot'

import type { Dispatch } from '../../../redux/types'
import styles from './styles.css'

export type PromptProps = {|
  modulesMissing: boolean,
  onPromptClick: () => mixed,
  hasDuplicateModules: boolean,
|}

const missingAlertProps = {
  type: 'warning',
  title: 'Module Missing',
  className: styles.alert,
}

const connectedAlertProps = {
  type: 'success',
  title: 'Module succesfully detected.',
  className: styles.alert,
}

export function Prompt(props: PromptProps): React.Node {
  const { modulesMissing, onPromptClick, hasDuplicateModules } = props
  const [targetProps, tooltipProps] = useHoverTooltip()

  const dispatch = useDispatch<Dispatch>()

  const message =
    'Plug in and power up the required module(s) via the OT-2 USB Ports. Place the modules as show in the deck map.'
  const message2 =
    'Duplicate modules should be plugged in to the USB ports with the lowest deck slot number corresponding to the left-most USB port. Check out our help docs for more information on using duplicate modules.'
  const buttonText = 'continue to labware setup'
  const tooltipText = 'Connect module(s) to proceed to labware calibration'

  const nextUnconfirmedLabware = useSelector(
    robotSelectors.getUnconfirmedLabware
  )
  const nextLabware = useSelector(robotSelectors.getNotTipracks)
  const slot = nextUnconfirmedLabware?.[0]?.slot || nextLabware?.[0]?.slot
  const continueButtonOnClick = `/calibrate/labware/${slot}`
  return (
    <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
      <Text
        textAlign={TEXT_ALIGN_CENTER}
        fontSize={FONT_SIZE_HEADER}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        color={C_WHITE}
        marginX={SPACING_3}
      >
        {message}
      </Text>
      <Flex {...targetProps}>
        <LightSecondaryBtn
          marginY={SPACING_2}
          paddingX={SIZE_3}
          onClick={() => {
            onPromptClick()
            dispatch(push(continueButtonOnClick))
          }}
          disabled={modulesMissing}
        >
          {buttonText}
        </LightSecondaryBtn>
        <Tooltip {...tooltipProps}>{tooltipText}</Tooltip>
      </Flex>
      {hasDuplicateModules
      ? <Text paddingX={SPACING_4} marginBottom={SPACING_2} fontSize={FONT_SIZE_BODY_2} textAlign={TEXT_ALIGN_CENTER} color={C_WHITE}>
          {message2}
        </Text>
      : null}
    </Flex>
  )
}
