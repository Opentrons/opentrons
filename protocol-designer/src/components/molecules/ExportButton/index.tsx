import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Btn,
  COLORS,
  DISPLAY_FLEX,
  Icon,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { savePythonProtocolFile } from '../../../load-file/actions'

import type { ThunkDispatch } from '../../../types'

export function ExportButton(): JSX.Element {
  const { t } = useTranslation('shared')
  const dispatch: ThunkDispatch<any> = useDispatch()

  return (
    <Btn
      css={EXPORT_BUTTON_STYLE}
      onClick={() => dispatch(savePythonProtocolFile())}
    >
      {/* ToDo (kk 05/09/2025): icon will be replaced with the right one */}
      <Icon size="1rem" name="water-drop" data-testid="water-drop" />
      <StyledText desktopStyle="bodyDefaultSemiBold">{t('export')}</StyledText>
    </Btn>
  )
}

const EXPORT_BUTTON_STYLE = css`
  display: ${DISPLAY_FLEX};
  padding: ${SPACING.spacing8} ${SPACING.spacing16};
  grid-gap: ${SPACING.spacing8};
  align-items: ${ALIGN_CENTER};
  border-radius: ${BORDERS.borderRadius8};
  background-color: ${COLORS.grey30};

  &:focus-visible {
    outline-offset: 3px;
    outline: 2px ${BORDERS.styleSolid} ${COLORS.blue50};
  }

  &:active {
    background-color: ${COLORS.grey40};
  }

  &:hover {
    box-shadow: 0 0 0;
    background-color: ${COLORS.grey35};
  }

  &:disabled {
    background-color: ${COLORS.grey30};
    color: ${COLORS.grey40};
  }
`
