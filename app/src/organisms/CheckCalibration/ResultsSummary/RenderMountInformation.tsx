import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  COLORS,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getPipetteModelSpecs } from '@opentrons/shared-data'

import { StyledText } from '../../../atoms/text'

import type { Mount } from '../../../redux/pipettes/types'
import type { CalibrationCheckInstrument } from '../../../redux/sessions/types'

interface MountInformationProps {
  mount: Mount
  pipette?: CalibrationCheckInstrument
}

export const RenderMountInformation = ({
  mount,
  pipette,
}: MountInformationProps): JSX.Element => {
  const { t } = useTranslation('shared')
  const displayName =
    (pipette?.model != null &&
      getPipetteModelSpecs(pipette?.model)?.displayName) ||
    pipette?.model
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledText
        css={TYPOGRAPHY.h6SemiBold}
        color={COLORS.grey50}
        textTransform={TYPOGRAPHY.textTransformUppercase}
      >{`${mount} MOUNT`}</StyledText>
      {pipette != null ? (
        <StyledText as="p">{displayName}</StyledText>
      ) : (
        <StyledText as="p" textTransform={TYPOGRAPHY.textTransformCapitalize}>
          {t('empty')}
        </StyledText>
      )}
    </Flex>
  )
}
