import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  COLORS,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
  Box,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { ProgressBar } from '../../atoms/ProgressBar'

interface UpdateSoftwareProps {
  updateType: 'downloading' | 'validating' | 'sendingFile' | 'installing' | null
  processProgress: number
}
export function UpdateSoftware({
  updateType,
  processProgress,
}: UpdateSoftwareProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const renderText = (): string | null => {
    switch (updateType) {
      case 'downloading':
        return t('downloading_software')
      case 'validating':
        return t('validating_software')
      case 'sendingFile':
        return t('sending_software')
      case 'installing':
        return t('installing_software')
      default:
        console.warn('Update software has an issue')
        return null
    }
  }

  return (
    <Flex
      backgroundColor={COLORS.darkGreyDisabled}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height="33rem"
    >
      <StyledText
        fontSize="2rem"
        lineHeight="2.75rem"
        fontWeight="700"
        colors={COLORS.black}
      >
        {t('update_found')}
      </StyledText>
      <StyledText
        fontSize="1.5rem"
        lineHeight="2.0625rem"
        fontWeight="400"
        marginBottom={SPACING.spacingXXL}
      >
        {renderText()}
      </StyledText>
      <Box width="47.5rem">
        <ProgressBar percentComplete={processProgress} />
      </Box>
    </Flex>
  )
}
