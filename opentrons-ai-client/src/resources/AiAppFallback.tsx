import { useTranslation } from 'react-i18next'

import {
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  Flex,
  Modal,
  PrimaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { FallbackProps } from 'react-error-boundary'

export function AiAppFallback({
  error,
  resetErrorBoundary,
}: FallbackProps): JSX.Element {
  const { t } = useTranslation('shared')

  const handleReloadClick = (): void => {
    resetErrorBoundary()
  }

  return (
    <Modal type="warning" title={t('error_boundary_title')}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('error_boundary_description')}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {error.message}
          </StyledText>
        </Flex>
        <Flex alignSelf={ALIGN_FLEX_END} gridGap={SPACING.spacing8}>
          <PrimaryButton variant="warning" onClick={handleReloadClick}>
            {t('reload_app')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
