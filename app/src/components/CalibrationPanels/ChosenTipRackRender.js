// @flow
import * as React from 'react'
import { css } from 'styled-components'

import {
  Box,
  Flex,
  Text,
  ALIGN_CENTER,
  C_MED_DARK_GRAY,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_1,
  FONT_SIZE_BODY_2,
  FONT_STYLE_ITALIC,
  JUSTIFY_CENTER,
  SPACING_2,
  SPACING_3,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'
import { labwareImages } from './labwareImages'
import { formatLastModified } from './utils'

import type { SelectOption } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { TipLengthCalibration } from '../../calibration/api-types'

const TIP_LENGTH_CALIBRATED_PROMPT = 'Calibrated on'
const OVERRIDE_TIP_LENGTH_CALIBRATED_PROMPT =
  'Choosing this tiprack will override previous Tip Length Calibration data.'
const TIP_LENGTH_UNCALIBRATED_PROMPT =
  'Not yet calibrated. You will calibrate this tip length before proceeding to Pipette Offset Calibration.'

type TipRackInfo = {|
  definition: LabwareDefinition2,
  calibration: TipLengthCalibration | null,
|}

export type TipRackMap = $Shape<{|
  [uri: string]: TipRackInfo,
|}>

export type ChosenTipRackRenderProps = {|
  showCalibrationText: boolean,
  selectedValue: SelectOption,
  tipRackByUriMap: TipRackMap,
|}

export function ChosenTipRackRender(
  props: ChosenTipRackRenderProps
): React.Node {
  const { showCalibrationText, selectedValue, tipRackByUriMap } = props
  const loadName = selectedValue.value.split('/')[1]
  const displayName = selectedValue.label
  const calibrationData = tipRackByUriMap[selectedValue.value].calibration

  const imageSrc =
    loadName in labwareImages
      ? labwareImages[loadName]
      : labwareImages['generic_custom_tiprack']
  return (
    <Flex
      height="100%"
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      paddingRight={SPACING_2}
      paddingBottom={SPACING_3}
      fontSize={FONT_SIZE_BODY_2}
    >
      <img
        css={css`
          max-width: 8rem;
          max-height: 6rem;
          flex: 0 1 5rem;
          display: block;
          margin-bottom: 1rem;
        `}
        src={imageSrc}
      />
      <Box>
        <Text textAlign={TEXT_ALIGN_CENTER} marginBottom={SPACING_2}>
          {displayName}
        </Text>
        {showCalibrationText && (
          <Text
            color={C_MED_DARK_GRAY}
            fontSize={FONT_SIZE_BODY_1}
            fontStyle={FONT_STYLE_ITALIC}
            textAlign={TEXT_ALIGN_CENTER}
          >
            {calibrationData
              ? `${TIP_LENGTH_CALIBRATED_PROMPT} ${formatLastModified(
                  calibrationData.lastModified
                )}. ${OVERRIDE_TIP_LENGTH_CALIBRATED_PROMPT}`
              : TIP_LENGTH_UNCALIBRATED_PROMPT}
          </Text>
        )}
      </Box>
    </Flex>
  )
}
