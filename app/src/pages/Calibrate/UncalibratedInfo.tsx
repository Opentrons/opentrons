import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { push } from 'connected-react-router'

import {
  Icon,
  PrimaryBtn,
  SecondaryBtn,
  Flex,
  Box,
  Text,
  SPACING_2,
  SPACING_3,
  FONT_BODY_2_DARK,
} from '@opentrons/components'

import { PIPETTE_MOUNTS } from '../../redux/pipettes'
import { selectors as robotSelectors } from '../../redux/robot'

import type { TipracksByMountMap } from '../../redux/robot'
import type { Dispatch } from '../../redux/types'
import type { Mount, StyleProps } from '@opentrons/components'

const IS_CALIBRATED = 'Pipette tip length is calibrated.'
const IS_NOT_CALIBRATED = 'Pipette tip length is not calibrated.'
const CALIBRATE_TIP_LENGTH = 'Calibrate tip length'
const RECALIBRATE_TIP_LENGTH = 'Re-Calibrate tip length'
const CONTINUE_TO_NEXT_TIP_TYPE = 'Continue to next tip type'
const CONTINUE_TO_NEXT_PIPETTE = 'Continue to next pipette'
const CONTINUE_TO_LABWARE_CALIBRATION = 'Continue to labware calibration'
const CONTINUE_TO_MODULE_SETUP = 'Continue to module setup'

const BTN_WIDTH = '23rem'

interface CalibrateButtonProps
  extends React.PropsWithChildren<StyleProps & React.HTMLAttributes<any>> {
  hasCalibrated: boolean
}

function CalibrateButton(props: CalibrateButtonProps): JSX.Element {
  const { hasCalibrated, ...otherProps } = props
  if (hasCalibrated) {
    return <SecondaryBtn {...otherProps} />
  } else {
    return <PrimaryBtn {...otherProps} />
  }
}

interface UncalibratedInfoProps {
  uncalibratedTipracksByMount: TipracksByMountMap
  mount: Mount
  hasCalibrated: boolean
  handleStart: () => unknown
  showSpinner: boolean
}

export function UncalibratedInfo(props: UncalibratedInfoProps): JSX.Element {
  const {
    uncalibratedTipracksByMount,
    mount,
    hasCalibrated,
    handleStart,
    showSpinner,
  } = props
  const dispatch = useDispatch<Dispatch>()

  const buttonText = !hasCalibrated
    ? CALIBRATE_TIP_LENGTH
    : RECALIBRATE_TIP_LENGTH
  const spinnerOrText = showSpinner ? (
    <Icon name="ot-spinner" height="1em" spin />
  ) : (
    buttonText
  )

  const otherMount: Mount | null = PIPETTE_MOUNTS.find(m => m !== mount) || null
  const modules = useSelector(robotSelectors.getModules)
  const allModulesReviewed = useSelector(robotSelectors.getModulesReviewed)
  const nextUnconfirmedLabware = useSelector(
    robotSelectors.getUnconfirmedLabware
  )
  const nextLabware = useSelector(robotSelectors.getNotTipracks)

  let continueText
  let defHash
  let continueButtonOnClick: string
  if (uncalibratedTipracksByMount?.[mount].length) {
    continueText = CONTINUE_TO_NEXT_TIP_TYPE
    defHash = uncalibratedTipracksByMount[mount][0].definitionHash || ''
    continueButtonOnClick = `/calibrate/pipettes/${mount}/${defHash}`
  } else {
    if (otherMount && uncalibratedTipracksByMount?.[otherMount].length) {
      continueText = CONTINUE_TO_NEXT_PIPETTE
      defHash = uncalibratedTipracksByMount[otherMount][0].definitionHash || ''
      continueButtonOnClick = `/calibrate/pipettes/${otherMount}/${defHash}`
    } else {
      if (modules && modules.length > 0 && !allModulesReviewed) {
        continueText = CONTINUE_TO_MODULE_SETUP
        continueButtonOnClick = `/calibrate/modules`
      } else {
        continueText = CONTINUE_TO_LABWARE_CALIBRATION
        const slot = nextUnconfirmedLabware?.[0]?.slot || nextLabware?.[0]?.slot
        continueButtonOnClick = `/calibrate/labware/${slot}`
      }
    }
  }

  return (
    <Flex>
      <Box flex="0 0 50%" padding={SPACING_3}>
        <Text css={FONT_BODY_2_DARK} marginBottom={SPACING_3}>
          {!hasCalibrated ? IS_NOT_CALIBRATED : IS_CALIBRATED}
        </Text>
        <CalibrateButton
          title={buttonText}
          hasCalibrated={hasCalibrated}
          marginBottom={SPACING_2}
          width={BTN_WIDTH}
          onClick={handleStart}
        >
          {spinnerOrText}
        </CalibrateButton>
        {hasCalibrated ? (
          <PrimaryBtn
            width={BTN_WIDTH}
            onClick={() => {
              dispatch(push(continueButtonOnClick))
            }}
          >
            {continueText}
          </PrimaryBtn>
        ) : null}
      </Box>
    </Flex>
  )
}
