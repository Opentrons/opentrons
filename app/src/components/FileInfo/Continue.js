// @flow
import * as React from 'react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import { getCalibrateLocation } from '../../nav'

import {
  useHoverTooltip,
  Box,
  PrimaryBtn,
  Text,
  Tooltip,
  FONT_SIZE_CAPTION,
  SPACING_1,
  SIZE_5,
  TEXT_ALIGN_RIGHT,
  TOOLTIP_LEFT,
} from '@opentrons/components'

// TODO(mc, 2020-07-27): i18n
const PROCEED_TO_CALIBRATE = 'Proceed to Calibrate'
const VERIFY_CALIBRATIONS = 'Verify pipette and labware calibrations'

export function Continue(): React.Node {
  const { path, disabledReason } = useSelector(getCalibrateLocation)
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_LEFT,
  })

  return (
    <Box textAlign={TEXT_ALIGN_RIGHT}>
      <PrimaryBtn
        as={Link}
        to={disabledReason ? '#' : path}
        className={cx({ disabled: disabledReason })}
        width={SIZE_5}
        marginBottom={SPACING_1}
        {...targetProps}
      >
        {PROCEED_TO_CALIBRATE}
      </PrimaryBtn>
      {disabledReason && <Tooltip {...tooltipProps}>{disabledReason}</Tooltip>}
      <Text fontSize={FONT_SIZE_CAPTION}>{VERIFY_CALIBRATIONS}</Text>
    </Box>
  )
}
