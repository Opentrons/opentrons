import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'
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
          data-testid={`AboutPipetteSlideout_serial_number_text_${pipetteId}`}
        >
          {t('serial_number')}
        </StyledText>
        <StyledText
          as="h6"
          paddingTop={SPACING.spacing2}
          data-testid={`AboutPipetteSlideout_serial_${pipetteId}`}
        >
          {pipetteId}
        </StyledText>
      </Flex>
    </Slideout>
  )
}
