// @flow

import * as React from 'react'
import { format } from 'date-fns'
import {head} from 'lodash'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import {getLatestLabwareDef} from '../../getLabware'

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
  customLabware: Array<LabwareDefinition2>
|}

const NO_PIPETTE = 'n/a'
const NO_CALIBRATION = "You haven't calibrated this pipette yet"
const LAST_CALIBRATED = 'Last calibrated'
const WITH = 'with'
const UNKNOWN_CUSTOM_LABWARE = 'unknown custom tiprack'

function getCustomLabwareDefinition(loadName: string, customLabware: Array<LabwareDefinition2>): LabwareDefinition2 | null {
  return head(customLabware.filter((def) => def.parameters.loadName === loadName)) || null
}

function getDisplayNameForTiprack(tiprackUri: string, customLabware: Array<LabwareDefinition2>): string {
  const [namespace, loadName, version] = tiprackUri ? tiprackUri.split('/'): ['', '', '']
  const definition = namespace === "opentrons"
        ? getLatestLabwareDef(loadName)
        : getCustomLabwareDefinition(loadName, customLabware)
  return definition
    ? getLabwareDisplayName(definition)
    : `${UNKNOWN_CUSTOM_LABWARE}`
}

function buildCalibrationText(calibration: PipetteOffsetCalibration,
                              customLabware: Array<LabwareDefinition2>): React.Node {

  return calibration
    ? (<><Text fontStyle={FONT_STYLE_ITALIC}>
         {`${LAST_CALIBRATED}: ${format(new Date(calibration.lastModified), 'MMMM d y HH:mm')}`}
       </Text>
       <Text fontStyle={FONT_STYLE_ITALIC}>
         {`${WITH} ${getDisplayNameForTiprack(calibration.tiprackUri, customLabware)}`}
       </Text></>)
    : (<Text fontStyle={FONT_STYLE_ITALIC}>{NO_CALIBRATION}</Text>)

}

export function PipetteOffsetItem(props: Props): React.Node {
  const {mount, pipette, calibration, customLabware} = props
  return (
    <Box width={'50%'} display={DISPLAY_INLINE_BLOCK}>
    <Text as={"h4"} textTransform={TEXT_TRANSFORM_UPPERCASE} fontWeight={FONT_WEIGHT_BOLD} marginBottom={SPACING_2}>
      {mount}
    </Text>
      <Text textTransform={TEXT_TRANSFORM_UPPERCASE} fontWeight={FONT_WEIGHT_BOLD} marginBottom={SPACING_2}>
        {(pipette && pipette.modelSpecs ? pipette.modelSpecs.displayName : NO_PIPETTE )}
      </Text>
      {pipette && buildCalibrationText(calibration, customLabware)}
    </Box>
  )
}
