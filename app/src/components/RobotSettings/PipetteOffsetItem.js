// @flow

import * as React from 'react'
import { format } from 'date-fns'

import { getLabwareDisplayName } from '@opentrons/shared-data'

import {Box,
        Text,
        DISPLAY_INLINE_BLOCK,
        FONT_STYLE_ITALIC,
        FONT_WEIGHT_BOLD,
        SPACING_2,
       TEXT_TRANSFORM_UPPERCASE,
       } from '@opentrons/components'

import type { AttachedPipette } from '../../pipettes/types'
import type { PipetteOffsetCalibration } from '../../calibration/types'

type Props = {|
  mount: 'left' | 'right',
  pipette: AttachedPipette | null,
  calibration: PipetteOffsetCalibration | null,
|}

const NO_PIPETTE = 'n/a'
const NO_CALIBRATION = "You haven't calibrated this pipette yet"
const LAST_CALIBRATED = 'Last calibrated'
const WITH = 'with'

function getDisplayNameForTiprack(labwareName: string): string {
  return labwareName
}

function buildCalibrationText(calibration: PipetteOffsetCalibration): React.Node {
  return calibration
    ? (<><Text fontStyle={FONT_STYLE_ITALIC}>
         {`${LAST_CALIBRATED}: ${format(new Date(calibration.lastModified), 'MMMM d y HH:mm')}`}
       </Text>
       <Text fontStyle={FONT_STYLE_ITALIC}>
         {`${WITH} ${getDisplayNameForTiprack(calibration.tiprack)}`}
       </Text></>)
    : (<Text fontStyle={FONT_STYLE_ITALIC}>{NO_CALIBRATION}</Text>)

}

export function PipetteOffsetItem(props: Props): React.Node {
  const {mount, pipette, calibration} = props
  return (
    <Box width={'50%'} display={DISPLAY_INLINE_BLOCK}>
    <Text as={"h4"} textTransform={TEXT_TRANSFORM_UPPERCASE} fontWeight={FONT_WEIGHT_BOLD} marginBottom={SPACING_2}>
      {mount}
    </Text>
      <Text textTransform={TEXT_TRANSFORM_UPPERCASE} fontWeight={FONT_WEIGHT_BOLD} marginBottom={SPACING_2}>
        {(pipette && pipette.modelSpecs ? pipette.modelSpecs.displayName : NO_PIPETTE )}
      </Text>
      {buildCalibrationText(calibration)}
    </Box>
  )
}
