// @flow

import * as React from 'react'
import { format } from 'date-fns'
import { head } from 'lodash'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { findLabwareDefWithCustom } from '../../findLabware'

import {
  Box,
  Text,
  DISPLAY_INLINE_BLOCK,
  FONT_STYLE_ITALIC,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  SPACING_2,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'

import {
  InlineCalibrationWarning,
  RECOMMENDED,
} from '../InlineCalibrationWarning'
import type { AttachedPipette, PipetteCalibrations } from '../../pipettes/types'

type Props = {|
  mount: 'left' | 'right',
  pipette: AttachedPipette | null,
  calibration: PipetteCalibrations | null,
  customLabware: Array<LabwareDefinition2>,
|}

const NO_PIPETTE = 'n/a'
const NO_CALIBRATION = "You haven't calibrated this pipette yet"
const LAST_CALIBRATED = 'Last calibrated'
const WITH = 'with'
const UNKNOWN_CUSTOM_LABWARE = 'unknown custom tiprack'

function getDisplayNameForTiprack(
  tiprackUri: string,
  customLabware: Array<LabwareDefinition2>
): string {
  const [namespace, loadName] = tiprackUri ? tiprackUri.split('/') : ['', '']
  const definition = findLabwareDefWithCustom(
    namespace,
    loadName,
    null,
    customLabware
  )
  return definition
    ? getLabwareDisplayName(definition)
    : `${UNKNOWN_CUSTOM_LABWARE}`
}

function buildCalibrationText(
  calibration: PipetteCalibrations | null,
  customLabware: Array<LabwareDefinition2>
): React.Node {
  return calibration && calibration.offset ? (
    <>
      <Text fontStyle={FONT_STYLE_ITALIC}>
        {`${LAST_CALIBRATED}: ${format(
          new Date(calibration?.offset?.lastModified ?? ''),
          'MMMM d y HH:mm'
        )}`}
      </Text>
      <Text fontStyle={FONT_STYLE_ITALIC}>
        {`${WITH} ${getDisplayNameForTiprack(
          calibration?.offset?.tiprackUri ?? '',
          customLabware
        )}`}
      </Text>
    </>
  ) : (
    <Text fontStyle={FONT_STYLE_ITALIC}>{NO_CALIBRATION}</Text>
  )
}

export function PipetteOffsetItem(props: Props): React.Node {
  const { mount, pipette, calibration, customLabware } = props
  return (
    <Box width={'50%'} display={DISPLAY_INLINE_BLOCK}>
      <Text
        as={'h4'}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING_1}
      >
        {mount}
      </Text>
      {pipette &&
        (calibration?.offset?.status.markedBad ||
          calibration?.tipLength?.status.markedBad) && (
          <InlineCalibrationWarning warningType={RECOMMENDED} />
        )}
      <Text
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginTop={SPACING_1}
        marginBottom={SPACING_2}
      >
        {pipette && pipette.modelSpecs
          ? pipette.modelSpecs.displayName
          : NO_PIPETTE}
      </Text>
      {pipette && buildCalibrationText(calibration, customLabware)}
    </Box>
  )
}
