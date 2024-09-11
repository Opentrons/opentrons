import * as React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'
import { toggleNewProtocolModal } from './navigation/actions'
import { actions as loadFileActions } from './load-file'
import { getFileMetadata } from './file-data/selectors'
import { BUTTON_LINK_STYLE } from './atoms'
import type { ThunkDispatch } from './types'

export function NavigationBar(): JSX.Element | null {
  const { t, i18n } = useTranslation('shared')
  const location = useLocation()
  const navigate = useNavigate()
  const metadata = useSelector(getFileMetadata)
  const dispatch: ThunkDispatch<any> = useDispatch()
  const loadFile = (
    fileChangeEvent: React.ChangeEvent<HTMLInputElement>
  ): void => {
    dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
    dispatch(toggleNewProtocolModal(false))
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
            <NavbarLink
              key="createNew"
              to="/createNew"
              onClick={() => {
                dispatch(toggleNewProtocolModal(true))
              }}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('create_new')}
              </StyledText>
            </NavbarLink>
          )}
          <StyledLabel>
            <Flex css={BUTTON_LINK_STYLE}>
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('import')}
              </StyledText>
            </Flex>
            <input type="file" onChange={loadFile}></input>
          </StyledLabel>
        </Flex>
        {location.pathname === '/createNew' ? (
          <NavbarLink
            key="exit"
            to={metadata?.created != null ? '/overview' : '/'}
            onClick={() => {
              dispatch(toggleNewProtocolModal(false))
            }}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {i18n.format(t('exit'), 'capitalize')}
            </StyledText>
          </NavbarLink>
        ) : null}
      </Flex>
    </Flex>
  )
}

const NavbarLink = styled(NavLink)`
  color: ${COLORS.grey60};
  text-decoration: none;
  align-self: ${ALIGN_CENTER};
  &:hover {
    color: ${COLORS.grey40};
  }
`

const StyledLabel = styled.label`
  height: 20px;
  cursor: pointer;
  input[type='file'] {
    display: none;
  }
`
