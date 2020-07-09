// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getCalibrateLocation, getRunLocation } from '../../nav'
import { PrimaryButton, HoverTooltip } from '@opentrons/components'
import styles from './styles.css'

type ContinueProps = {|
  labwareCalibrated: boolean,
|}

export function Continue({ labwareCalibrated }: ContinueProps): React.Node {
  const buttonText = labwareCalibrated
    ? 'Proceed to Run'
    : 'Proceed to Calibrate'
  const selector = labwareCalibrated ? getRunLocation : getCalibrateLocation
  const { path, disabledReason } = useSelector(selector)

  // TODO(mc, 2019-11-26): tooltip positioning is all messed up with this component
  return (
    <HoverTooltip
      tooltipComponent={disabledReason ? <span>{disabledReason}</span> : null}
      placement="right"
    >
      {hoverTooltipHandlers => (
        <div className={styles.continue} {...hoverTooltipHandlers}>
          <PrimaryButton
            Component={Link}
            to={path}
            disabled={Boolean(disabledReason)}
            className={styles.continue_button}
          >
            {buttonText}
          </PrimaryButton>
        </div>
      )}
    </HoverTooltip>
  )
}
