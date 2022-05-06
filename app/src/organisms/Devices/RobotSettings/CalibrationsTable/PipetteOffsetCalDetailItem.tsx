import * as React from 'react'
import { useTranslation } from 'react-i18next'
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

import type { PipetteOffsetCalibration } from '../../../../redux/calibration/types'

interface PipetteOffsetCalDetailItemProps {
  robotName: string
  pipetteOffsetCalibration: PipetteOffsetCalibration
  // attachedPipettes: AttachedPipettesByMount
  // pipetteModel: string
  // pipetteSerial: string
  // mount: string
  // attached: boolean
  // tiprack: string
  // lastCalibrated: string
}

export function PipetteOffsetCalDetailItem({
  robotName,
  pipetteOffsetCalibration,
}: // attachedPipettes,
// pipetteModel,
// pipetteSerial,
// mount,
// attached,
// tiprack,
// lastCalibrated,
PipetteOffsetCalDetailItemProps): JSX.Element {
  const { t } = useTranslation('shared')

  const { id, mount, tiprackUri, lastModified } = pipetteOffsetCalibration
  // get model name
  // parse tiprackUri
  const attached = true // This is temporary until we display all pipettes offset calibrations
  return (
    <>
      <Divider />
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText as="p" width="10rem">
            {id}
          </StyledText>
          <StyledText as="p" width="10rem">
            {id}
          </StyledText>
        </Flex>
        <StyledText as="p" width="2.5rem" marginLeft={SPACING.spacing4}>
          {mount}
        </StyledText>
        <StyledText as="p" width="3.75rem" marginLeft={SPACING.spacing4}>
          {attached ? t('yes') : t('no')}
        </StyledText>
        <Flex css={{ 'word-wrap': 'break-word' }} marginLeft={SPACING.spacing4}>
          <StyledText as="p" width="8.5rem" height="2.5rem">
            {tiprackUri}
          </StyledText>
        </Flex>
        <StyledText as="p" marginLeft={SPACING.spacing4} width="7.375rem">
          {formatLastCalibrated(lastModified)}
        </StyledText>
        <OverflowMenu
          calType="pipetteOffset"
          robotName={robotName}
          pipetteOffsetCalibration={pipetteOffsetCalibration}
          mount={mount}
        />
      </Flex>
    </>
  )
}
