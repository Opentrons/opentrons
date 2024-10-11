import type * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { toggleNewProtocolModal } from './navigation/actions'
import { actions as loadFileActions } from './load-file'
import { BUTTON_LINK_STYLE } from './atoms'
import { getHasUnsavedChanges } from './load-file/selectors'
import { SettingsIcon } from './molecules'
import type { ThunkDispatch } from './types'

export function NavigationBar(): JSX.Element | null {
  const { t } = useTranslation(['shared', 'alert'])
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch: ThunkDispatch<any> = useDispatch()
  const loadFile = (
    fileChangeEvent: React.ChangeEvent<HTMLInputElement>
  ): void => {
    dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
    dispatch(toggleNewProtocolModal(false))
  }
  const hasUnsavedChanges = useSelector(getHasUnsavedChanges)

  const handleCreateNew = (): void => {
    if (
      !hasUnsavedChanges ||
      window.confirm(t('alert:confirm_create_new') as string)
    ) {
      dispatch(toggleNewProtocolModal(true))
      navigate('/createNew')
    }
  }

  return location.pathname === '/designer' ||
    location.pathname === '/liquids' ? null : (
    <Flex flexDirection={DIRECTION_COLUMN}>
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
          <StyledText desktopStyle="captionRegular" color={COLORS.grey50}>
            {t('version', { version: process.env.OT_PD_VERSION })}
          </StyledText>
        </Flex>
        <Flex gridGap={SPACING.spacing40} alignItems={ALIGN_CENTER}>
          {location.pathname === '/createNew' ? null : (
            <Btn onClick={handleCreateNew} css={BUTTON_LINK_STYLE}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('create_new')}
              </StyledText>
            </Btn>
          )}
          <StyledLabel>
            <Flex css={BUTTON_LINK_STYLE}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('import')}
              </StyledText>
            </Flex>
            <input type="file" onChange={loadFile}></input>
          </StyledLabel>
          {location.pathname === '/createNew' ? null : <SettingsIcon />}
        </Flex>
      </Flex>
    </Flex>
  )
}

const StyledLabel = styled.label`
  height: 20px;
  cursor: ${CURSOR_POINTER};
  input[type='file'] {
    display: none;
  }
`
