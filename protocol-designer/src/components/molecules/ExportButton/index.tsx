import { useTranslation } from 'react-i18next'

import { Btn, Icon, StyledText } from '@opentrons/components'

import { GREY_BUTTON_STYLE } from '/protocol-designer/components/atoms'

interface ExportButtonProps {
  onClick: () => void
}
export function ExportButton({ onClick }: ExportButtonProps): JSX.Element {
  const { t } = useTranslation('shared')

  return (
    <Btn css={GREY_BUTTON_STYLE} onClick={onClick}>
      <Icon size="1rem" name="export" />
      <StyledText desktopStyle="bodyDefaultSemiBold">{t('export')}</StyledText>
    </Btn>
  )
}
