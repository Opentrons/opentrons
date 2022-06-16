import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  TEXT_TRANSFORM_UPPERCASE,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import { Slideout } from '../../../atoms/Slideout'

import type { AttachedPipette } from '../../../redux/pipettes/types'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

interface AboutPipetteSlideoutProps {
  pipetteId: AttachedPipette['id']
  pipetteName: PipetteModelSpecs['displayName']
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const AboutPipetteSlideout = (
  props: AboutPipetteSlideoutProps
): JSX.Element | null => {
  const { pipetteId, pipetteName, isExpanded, onCloseClick } = props
  const { t } = useTranslation('device_details')

  return (
    <Slideout
      title={t('about_pipette_name', { name: pipetteName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText
          as="h6"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkGreyEnabled}
          data-testid={`AboutPipetteSlideout_serial_number_text_${pipetteId}`}
          textTransform={TEXT_TRANSFORM_UPPERCASE}
        >
          {t('serial_number')}
        </StyledText>
        <StyledText
          as="p"
          paddingTop={SPACING.spacing2}
          data-testid={`AboutPipetteSlideout_serial_${pipetteId}`}
        >
          {pipetteId}
        </StyledText>
      </Flex>
    </Slideout>
  )
}
