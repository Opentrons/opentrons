import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { Btn, Icon, StyledText } from '@opentrons/components'

import { savePythonProtocolFile } from '../../../load-file/actions'
import { GREY_BUTTON_STYLE } from '../../atoms'

import type { ThunkDispatch } from '../../../types'

export function ExportButton(): JSX.Element {
  const { t } = useTranslation('shared')
  const dispatch: ThunkDispatch<any> = useDispatch()

  return (
    <Btn
      css={GREY_BUTTON_STYLE}
      onClick={() => dispatch(savePythonProtocolFile())}
    >
      {/* ToDo (kk 05/09/2025): icon will be replaced with the right one */}
      <Icon size="1rem" name="water-drop" data-testid="water-drop" />
      <StyledText desktopStyle="bodyDefaultSemiBold">{t('export')}</StyledText>
    </Btn>
  )
}
