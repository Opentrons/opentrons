// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getCalibrateLocation } from '../../nav'
import {
  PrimaryButton,
  useHoverTooltip,
  Tooltip,
  TOOLTIP_AUTO,
  FONT_SIZE_CAPTION,
  Text,
} from '@opentrons/components'
import styles from './styles.css'

export function Continue(): React.Node {
  const buttonText = 'Proceed to Calibrate'
  const primarySublabelText = 'Verify pipette and labware calibrations'
  const { path, disabledReason } = useSelector(getCalibrateLocation)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_AUTO,
  })

  return (
    <div className={styles.continue} {...targetProps}>
      <PrimaryButton
        Component={Link}
        to={path}
        disabled={Boolean(disabledReason)}
        className={styles.continue_button}
      >
        {buttonText}
      </PrimaryButton>
      {disabledReason && <Tooltip {...tooltipProps}>{disabledReason}</Tooltip>}
      <Text fontSize={FONT_SIZE_CAPTION}>{primarySublabelText}</Text>
    </div>
  )
}
