import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_ROW,
  SPACING,
  Icon,
  SIZE_2,
} from '@opentrons/components'
import { StyledText } from '../../../../atoms/text'

interface UnMatchedModuleWarningProps {
  isAnyModuleUnnecessary: boolean
}

export const UnMatchedModuleWarning = (
  props: UnMatchedModuleWarningProps
): JSX.Element | null => {
  const { t } = useTranslation('protocol_setup')
  const isVisible = props.isAnyModuleUnnecessary
  if (!isVisible) return null

  return (
    <Flex
      marginTop={SPACING.spacing4}
      flexDirection={DIRECTION_COLUMN}
      backgroundColor={COLORS.fundamentalsBackground}
      padding={SPACING.spacing5}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <Flex>
          <Icon
            size={SIZE_2}
            color={COLORS.darkGreyEnabled}
            name="information"
            paddingRight={SPACING.spacing3}
            paddingBottom={SPACING.spacingSM}
            aria-label="information_icon"
          />
          <StyledText
            as="p"
            data-testid={`UnMatchedModuleWarning_title`}
            color={COLORS.darkBlackEnabled}
          >
            {t('module_mismatch_title')}
          </StyledText>
        </Flex>
      </Flex>

      <StyledText
        as="p"
        marginLeft={SPACING.spacing6}
        marginRight={SPACING.spacing4}
        color={COLORS.darkGrey}
        width="100%"
        data-testid={`UnMatchedModuleWarning_body`}
      >
        {t('module_mismatch_body')}
      </StyledText>
    </Flex>
  )
}
