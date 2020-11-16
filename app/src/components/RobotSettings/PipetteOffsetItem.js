// @flow

import * as React from 'react'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { findLabwareDefWithCustom } from '../../findLabware'

import {
  Box,
  Flex,
  Text,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  DIRECTION_COLUMN,
  DISPLAY_BLOCK,
  FONT_STYLE_ITALIC,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  SPACING_2,
  SPACING_3,
  OVERLAY_LIGHT_GRAY_50,
  TEXT_TRANSFORM_UPPERCASE,
  TEXT_TRANSFORM_CAPITALIZE,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'

import {
  InlineCalibrationWarning,
  RECOMMENDED,
  REQUIRED,
} from '../InlineCalibrationWarning'
import { formatLastModified } from '../CalibrationPanels/utils'
import type { AttachedPipette, PipetteCalibrations } from '../../pipettes/types'
import type {
  PipetteOffsetCalibration,
  TipLengthCalibration,
} from '../../calibration/types'

type Props = {|
  mount: 'left' | 'right',
  pipette: AttachedPipette | null,
  calibration: PipetteCalibrations | null,
  customLabware: Array<LabwareDefinition2>,
|}

const NO_PIPETTE = 'No pipette attached'
const LAST_CALIBRATED = 'Last calibrated'
const UNKNOWN_CUSTOM_LABWARE = 'unknown custom tiprack'
const PIPETTE_OFFSET_CALIBRATION = 'pipette offset calibration'
const TIP_LENGTH_CALIBRATION = 'tip length calibration'
const SERIAL_NUMBER = 'Serial number'
const TIP_LENGTH_NOT_DISPLAYED =
  'Calibrate your pipette to see saved tip length'

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

function getCalibrationDate(
  calibration: PipetteOffsetCalibration | TipLengthCalibration
): React.Node {
  return (
    <Text
      key={'calibrationDate'}
      fontStyle={FONT_STYLE_ITALIC}
      marginTop={SPACING_1}
    >
      {`${LAST_CALIBRATED}: ${formatLastModified(calibration.lastModified)}`}
    </Text>
  )
}

type PipetteOffsetSectionProps = {|
  pipette: AttachedPipette,
  calibration: PipetteOffsetCalibration | null,
|}

function PipetteOffsetSection(props: PipetteOffsetSectionProps): React.Node {
  const { pipette, calibration } = props
  return (
    <Box key={'pipetteOffset'} marginTop={SPACING_2}>
      <Text
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING_2}
      >
        {PIPETTE_OFFSET_CALIBRATION}
      </Text>
      {calibration ? (
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Text key={'displayName'}>{pipette.modelSpecs.displayName}</Text>
          <Text key={'serialNumber'}>{`${SERIAL_NUMBER}: ${pipette.id}`}</Text>
          {getCalibrationDate(calibration)}
        </Flex>
      ) : (
        <InlineCalibrationWarning warningType={REQUIRED} />
      )}
    </Box>
  )
}

type TipLengthSectionProps = {|
  calibration: PipetteCalibrations | null,
  customLabware: Array<LabwareDefinition2>,
|}

export function TipLengthSection(props: TipLengthSectionProps): React.Node {
  const { calibration, customLabware } = props
  return (
    <Box key={'tipLength'} marginTop={SPACING_3}>
      <Text
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING_2}
      >
        {TIP_LENGTH_CALIBRATION}
      </Text>
      {calibration?.offset && calibration?.tipLength ? (
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Text key={'tiprackDisplayName'}>
            {getDisplayNameForTiprack(
              calibration.offset.tiprackUri,
              customLabware
            )}
          </Text>
          {calibration?.tipLength && getCalibrationDate(calibration.tipLength)}
        </Flex>
      ) : (
        <Text fontStyle={FONT_STYLE_ITALIC}>{TIP_LENGTH_NOT_DISPLAYED}</Text>
      )}
    </Box>
  )
}

export function PipetteOffsetItem(props: Props): React.Node {
  const { mount, pipette, calibration, customLabware } = props
  return (
    <Box width={'50%'} display={DISPLAY_BLOCK}>
      <Text
        as={'h4'}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING_1}
      >
        {`${mount} mount`}
      </Text>
      <Box
        marginTop={SPACING_2}
        backgroundColor={OVERLAY_LIGHT_GRAY_50}
        width={'95%'}
        height={'90%'}
        padding={SPACING_2}
        marginBottom={SPACING_2}
      >
        {pipette &&
          (calibration?.offset?.status?.markedBad ||
            calibration?.tipLength?.status?.markedBad) && (
            <InlineCalibrationWarning
              marginTop={'0'}
              warningType={RECOMMENDED}
            />
          )}

        {pipette && pipette.modelSpecs ? (
          <Flex
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <PipetteOffsetSection
              pipette={pipette}
              calibration={calibration?.offset ?? null}
            />
            <TipLengthSection
              calibration={calibration}
              customLabware={customLabware}
            />
          </Flex>
        ) : (
          <Flex
            size={'100%'}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_CENTER}
          >
            <Text fontStyle={FONT_STYLE_ITALIC}>{NO_PIPETTE}</Text>
          </Flex>
        )}
      </Box>
    </Box>
  )
}
