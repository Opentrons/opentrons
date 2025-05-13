import { useTranslation } from 'react-i18next'

import { Btn, Icon, StyledText } from '@opentrons/components'

import { GREY_BUTTON_STYLE } from '../../atoms'

interface ExportButtonProps {
  onClick: () => void
}
export function ExportButton({ onClick }: ExportButtonProps): JSX.Element {
  const { t } = useTranslation('shared')

  return (
    <Btn css={GREY_BUTTON_STYLE} onClick={onClick}>
      <Icon size="1rem" name="export" data-testid="export-icon" />
      <StyledText desktopStyle="bodyDefaultSemiBold">{t('export')}</StyledText>
    </Btn>
  )
}
