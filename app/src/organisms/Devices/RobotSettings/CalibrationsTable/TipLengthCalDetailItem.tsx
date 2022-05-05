import * as React from 'react'
import {
  Flex,
  DIRECTION_ROW,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { Divider } from '../../../../atoms/structure'
import { OverflowMenu } from './OverflowMenu'
import { formatLastCalibrated } from './utils'

interface TipLengthCalDetailItemProps {
  robotName: string
  tiprack: string
  pipetteModel: string
  pipetteSerial: string
  lastCalibrated: string
}

export function TipLengthCalDetailItem({
  robotName,
  tiprack,
  pipetteModel,
  pipetteSerial,
  lastCalibrated,
}: TipLengthCalDetailItemProps): JSX.Element {
  return (
    <>
      <Divider />
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Flex
          css={{ 'word-wrap': 'break-word' }}
          marginRight={SPACING.spacing4}
        >
          <StyledText as="p" width="13.375rem" marginLeft={SPACING.spacing4}>
            {tiprack}
          </StyledText>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          width="11.75rem"
          css={{ 'word-wrap': 'break-word' }}
        >
          <StyledText as="p">{pipetteModel}</StyledText>
          <StyledText as="p">{pipetteSerial}</StyledText>
        </Flex>
        <StyledText as="p" width="12.5rem">
          {formatLastCalibrated(lastCalibrated)}
        </StyledText>
        <OverflowMenu calType="tipLength" robotName={robotName} />
      </Flex>
    </>
  )
}
