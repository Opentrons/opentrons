import * as React from 'react'
import { useTranslation } from 'react-i18next'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import { findLabwareDefWithCustom } from '../../../assets/labware/findLabware'

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
} from '../../../molecules/InlineCalibrationWarning'
import { formatLastModified } from '../../../organisms/CalibrationPanels/utils'
import type {
  AttachedPipette,
  PipetteCalibrations,
} from '../../../redux/pipettes/types'
import type {
  PipetteOffsetCalibration,
  TipLengthCalibration,
} from '../../../redux/calibration/types'

interface Props {
  mount: 'left' | 'right'
  pipette: AttachedPipette | null
  calibration: PipetteCalibrations | null
  customLabware: LabwareDefinition2[]
}

function TipRackDisplayName(props: {
  tiprackUri: string
  customLabware: LabwareDefinition2[]
}): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  const { tiprackUri, customLabware } = props
  const [namespace, loadName] = tiprackUri ? tiprackUri.split('/') : ['', '']
  const definition = findLabwareDefWithCustom(
    namespace,
    loadName,
    null,
    customLabware
  )
  return (
    <Text>
      {definition
        ? getLabwareDisplayName(definition)
        : `${t('unknown_custom_tiprack')}`}
    </Text>
  )
}

function LastCalibrated(props: {
  calibration: PipetteOffsetCalibration | TipLengthCalibration
}): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  return (
    <Text
      key={'calibrationDate'}
      fontStyle={FONT_STYLE_ITALIC}
      marginTop={SPACING_1}
    >
      {`${t('last_calibrated')}: ${formatLastModified(
        props.calibration.lastModified
      )}`}
    </Text>
  )
}

interface PipetteOffsetSectionProps {
  pipette: AttachedPipette
  calibration: PipetteOffsetCalibration | null
}

function PipetteOffsetSection(props: PipetteOffsetSectionProps): JSX.Element {
  const { t } = useTranslation('robot_calibration')
  const { pipette, calibration } = props
  return (
    <Box key={'pipetteOffset'} marginTop={SPACING_2}>
      <Text
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING_2}
      >
        {t('pipette_offset_title')}
      </Text>
      {calibration ? (
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Text key={'displayName'}>{pipette.modelSpecs.displayName}</Text>
          <Text key={'serialNumber'}>{`${t('serial_number')}: ${
            pipette.id
          }`}</Text>
          <LastCalibrated calibration={calibration} />
        </Flex>
      ) : (
        <InlineCalibrationWarning warningType={REQUIRED} />
      )}
    </Box>
  )
}

interface TipLengthSectionProps {
  calibration: PipetteCalibrations | null
  customLabware: LabwareDefinition2[]
}

export function TipLengthSection(props: TipLengthSectionProps): JSX.Element {
  const { calibration, customLabware } = props
  const { t } = useTranslation('robot_calibration')
  return (
    <Box key={'tipLength'} marginTop={SPACING_3}>
      <Text
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        marginBottom={SPACING_2}
      >
        {t('tip_length')}
      </Text>
      {calibration?.offset && calibration?.tipLength ? (
        <Flex flexDirection={DIRECTION_COLUMN}>
          <TipRackDisplayName
            tiprackUri={calibration.offset.tiprackUri}
            customLabware={customLabware}
          />
          {calibration?.tipLength && (
            <LastCalibrated calibration={calibration.tipLength} />
          )}
        </Flex>
      ) : (
        <Text fontStyle={FONT_STYLE_ITALIC}>{t('no_tip_length')}</Text>
      )}
    </Box>
  )
}

export function PipetteOffsetItem(props: Props): JSX.Element {
  const { t } = useTranslation('robot_calibration')
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
            <Text fontStyle={FONT_STYLE_ITALIC}>{t('no_pipette')}</Text>
          </Flex>
        )}
      </Box>
    </Box>
  )
}
