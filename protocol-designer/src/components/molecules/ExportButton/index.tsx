import { useTranslation } from 'react-i18next'

import { Btn, Icon, StyledText } from '@opentrons/components'

import { GREY_BUTTON_STYLE } from '../../atoms'

import type { Dispatch, SetStateAction } from 'react'

interface ExportButtonProps {
  setShowExportWarningModal: Dispatch<SetStateAction<boolean>>
}
export function ExportButton({
  setShowExportWarningModal,
}: ExportButtonProps): JSX.Element {
  const { t } = useTranslation('shared')

  return (
    <Btn
      css={GREY_BUTTON_STYLE}
      onClick={() => {
        setShowExportWarningModal(true)
      }}
    >
      {/* ToDo (kk 05/09/2025): icon will be replaced with the right one */}
      <Icon size="1rem" name="water-drop" data-testid="water-drop" />
      <StyledText desktopStyle="bodyDefaultSemiBold">{t('export')}</StyledText>
    </Btn>
  )
}
