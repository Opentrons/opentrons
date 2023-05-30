import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  SPACING,
  TYPOGRAPHY,
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
      backgroundColor={COLORS.darkBlack20}
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing40}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
      width="100%"
      height="33rem"
      borderRadius={BORDERS.size3}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        alignItems={ALIGN_CENTER}
      >
        <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
          {t('update_found')}
        </StyledText>
        <StyledText
          as="h3"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkBlack70}
        >
          {renderText()}
        </StyledText>
      </Flex>
      <Box width="47.5rem">
        <ProgressBar percentComplete={processProgress} />
      </Box>
    </Flex>
  )
}
