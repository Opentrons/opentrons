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
  StyledText,
} from '@opentrons/components'
import { getFileMetadata } from './file-data/selectors'
import { actions as loadFileActions } from './load-file'
import type { ThunkDispatch } from './types'

export function NavigationBar(): JSX.Element {
  const { t } = useTranslation('shared')
  const metadata = useSelector(getFileMetadata)
  const location = useLocation()
  const dispatch: ThunkDispatch<any> = useDispatch()
  const navigate = useNavigate()
  const loadFile = (
    fileChangeEvent: React.ChangeEvent<HTMLInputElement>
  ): void => {
    dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
  }

  React.useEffect(() => {
    if (metadata?.created != null) {
      navigate('/overview')
    }
  }, [metadata, navigate])

  return (
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
            <NavbarLink key="createNew" to="/createNew">
              <StyledText desktopStyle="bodyDefaultRegular">
                {t('create_new_protocol')}
              </StyledText>
            </NavbarLink>
          )}
          <StyledLabel>
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
              {t('import')}
            </StyledText>
            <input type="file" onChange={loadFile}></input>
          </StyledLabel>
        </Flex>
      </Flex>
    </Flex>
  )
}

const NavbarLink = styled(NavLink)`
  color: ${COLORS.black90};
  text-decoration: none;
  align-self: ${ALIGN_CENTER};
  &:hover {
    color: ${COLORS.black70};
  }
`

const StyledLabel = styled.label`
  height: 20px;
  cursor: pointer;
  input[type='file'] {
    display: none;
  }
`
