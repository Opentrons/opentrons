import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  CURSOR_POINTER,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { actions as loadFileActions } from '../../../load-file'
import { getHasUnsavedChanges } from '../../../load-file/selectors'
import { toggleNewProtocolModal } from '../../../navigation/actions'
import { LINK_BUTTON_STYLE } from '../../atoms'
import { SettingsIcon } from '../SettingsIcon'

import type { ChangeEvent } from 'react'
import type { ThunkDispatch } from '../../../types'

export function Navigation(): JSX.Element | null {
  const { t } = useTranslation(['shared', 'alert'])
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch: ThunkDispatch<any> = useDispatch()
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
        <Btn onClick={handleCreateNew} css={LINK_BUTTON_STYLE}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('create_new')}
          </StyledText>
        </Btn>
        <StyledLabel>
          <Flex css={LINK_BUTTON_STYLE}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('import')}
            </StyledText>
          </Flex>
          <input type="file" onChange={loadFile} aria-label={t('import')} />
        </StyledLabel>
        {location.pathname === '/createNew' ? null : <SettingsIcon />}
      </Flex>
    </Flex>
  )
}

const StyledLabel = styled.label`
  height: 1.25rem;
  cursor: ${CURSOR_POINTER};
  input[type='file'] {
    display: none;
  }
`
