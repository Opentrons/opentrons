// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getCalibrateLocation, getRunLocation } from '../../nav'
import {
  PrimaryButton,
  OutlineButton,
  Flex,
  useHoverTooltip,
  Tooltip,
  TOOLTIP_AUTO,
  FONT_SIZE_CAPTION,
  JUSTIFY_SPACE_BETWEEN,
  Text,
} from '@opentrons/components'
import styles from './styles.css'

type ContinueProps = {|
  labwareCalibrated: boolean,
|}

export function Continue({ labwareCalibrated }: ContinueProps): React.Node {
  const buttonText = labwareCalibrated
    ? 'Proceed to Run'
    : 'Proceed to Calibrate'
  const primarySublabelText = labwareCalibrated
    ? 'Use existing labware and pipette calibrations'
    : 'Calibrate labware and pipette prior to run'
  const secondaryButtonText = 'Re-calibrate'
  const secondarySublabelText = 'Re-calibrate labware and pipette prior to run'
  const selector = labwareCalibrated ? getRunLocation : getCalibrateLocation
  const {
    path: secondaryButtonPath,
    disabledReason: secondaryDisabledReason,
  } = useSelector(getCalibrateLocation)
  const { path, disabledReason } = useSelector(selector)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_AUTO,
  })

  return (
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
      {labwareCalibrated && (
        <div>
          <OutlineButton
            Component={Link}
            to={secondaryButtonPath}
            disabled={Boolean(secondaryDisabledReason)}
            className={styles.continue_button}
          >
            {secondaryButtonText}
          </OutlineButton>
          <Text fontSize={FONT_SIZE_CAPTION}>{secondarySublabelText}</Text>
        </div>
      )}
      <div {...targetProps}>
        <PrimaryButton
          Component={Link}
          to={path}
          disabled={Boolean(disabledReason)}
          className={styles.continue_button}
        >
          {buttonText}
        </PrimaryButton>
        {disabledReason && (
          <Tooltip {...tooltipProps}>{disabledReason}</Tooltip>
        )}
        <Text fontSize={FONT_SIZE_CAPTION}>{primarySublabelText}</Text>
      </div>
    </Flex>
  )
}
