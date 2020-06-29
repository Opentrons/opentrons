// @flow
import { HoverTooltip, PrimaryButton } from '@opentrons/components'
import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getCalibrateLocation } from '../../nav'
import styles from './styles.css'

export function Continue(): React.Node {
  const { path, disabledReason } = useSelector(getCalibrateLocation)

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
            Proceed to Calibrate
          </PrimaryButton>
        </div>
      )}
    </HoverTooltip>
  )
}
