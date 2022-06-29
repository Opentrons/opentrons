import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyledText } from '../../../../atoms/text'
import { Banner } from './Banner/Banner'

interface UnMatchedModuleWarningProps {
  isAnyModuleUnnecessary: boolean
}

export const UnMatchedModuleWarning = (
  props: UnMatchedModuleWarningProps
): JSX.Element | null => {
  const { t } = useTranslation('protocol_setup')
  const [showModulesMismatch, setShowModulesMismatch] = React.useState<boolean>(
    true
  )
  const isVisible = showModulesMismatch && props.isAnyModuleUnnecessary
  if (!isVisible) return null

  return (
    <Banner
      title={t('module_mismatch_title')}
      onClose={() => setShowModulesMismatch(false)}
      data-testid={`UnMatchedModuleWarning_banner`}
    >
      <StyledText as="p">{t('module_mismatch_body')}</StyledText>
    </Banner>
  )
}
