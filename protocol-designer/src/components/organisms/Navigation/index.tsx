import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  BasicButton,
  COLORS,
  CURSOR_POINTER,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { ACCEPTED_PROTOCOL_FILE_TYPES } from '/protocol-designer/constants'
import { actions as loadFileActions } from '/protocol-designer/load-file'
import { getHasUnsavedChanges } from '/protocol-designer/load-file/selectors'
import { toggleNewProtocolModal } from '/protocol-designer/navigation/actions'

import { SettingsIcon } from '../SettingsIcon'

import type { ChangeEvent } from 'react'
import type { ThunkDispatch } from '/protocol-designer/types'

export function Navigation(): JSX.Element | null {
  const { t } = useTranslation(['shared', 'alert'])
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch: ThunkDispatch<any> = useDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const loadFile = (fileChangeEvent: ChangeEvent<HTMLInputElement>): void => {
    dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
    dispatch(toggleNewProtocolModal(false))
    navigate('/overview')
  }
  const hasUnsavedChanges = useSelector(getHasUnsavedChanges)

  const handleCreateNew = (): void => {
    if (
      !hasUnsavedChanges ||
      window.confirm(t('alert:confirm_create_new') as string)
    ) {
      navigate('/createNew', { state: { modalResetKey: Date.now() } })
    }
  }

  const handleImport = (): void => {
    if (fileInputRef.current != null) {
      fileInputRef.current.click()
    }
  }

  return (
    <Flex
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={`${SPACING.spacing12} ${SPACING.spacing40}`}
    >
      <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('opentrons')}
        </StyledText>
        <StyledText desktopStyle="bodyLargeSemiBold" color={COLORS.purple50}>
          {t('protocol_designer')}
        </StyledText>
      </Flex>
      <Flex gridGap={SPACING.spacing40} alignItems={ALIGN_CENTER}>
        <BasicButton onClick={handleCreateNew}>{t('create_new')}</BasicButton>
        <StyledLabel>
          <BasicButton onClick={handleImport}>{t('import')}</BasicButton>
          <input
            type="file"
            onChange={loadFile}
            aria-label={t('import')}
            ref={fileInputRef}
            accept={ACCEPTED_PROTOCOL_FILE_TYPES}
          />
        </StyledLabel>
        {location.pathname === '/createNew' ? null : <SettingsIcon />}
      </Flex>
    </Flex>
  )
}

const StyledLabel = styled.label`
  cursor: ${CURSOR_POINTER};
  input[type='file'] {
    display: none;
  }
`
