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

import type { AttachedPipettesByMount } from '../../../../redux/pipettes/types'

interface PipetteOffsetCalDetailItemProps {
  robotName: string
  attachedPipettes: AttachedPipettesByMount
  pipetteModel: string
  pipetteSerial: string
  mount: string
  attached: boolean
  tiprack: string
  lastCalibrated: string
}

export function PipetteOffsetCalDetailItem({
  robotName,
  attachedPipettes,
  pipetteModel,
  pipetteSerial,
  mount,
  attached,
  tiprack,
  lastCalibrated,
}: PipetteOffsetCalDetailItemProps): JSX.Element {
  const { t } = useTranslation('shared')

  return (
    <>
      <Divider />
      <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText as="p" width="10rem">
            {pipetteModel}
          </StyledText>
          <StyledText as="p" width="10rem">
            {pipetteSerial}
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
            {tiprack}
          </StyledText>
        </Flex>
        <StyledText as="p" marginLeft={SPACING.spacing4} width="7.375rem">
          {formatLastCalibrated(lastCalibrated)}
        </StyledText>
        <OverflowMenu calType="pipetteOffset" robotName={robotName} />
      </Flex>
    </>
  )
}
