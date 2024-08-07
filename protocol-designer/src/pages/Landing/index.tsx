import * as React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  PrimaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { actions as loadFileActions } from '../../load-file'
import welcomeImage from '../../images/welcome_page.png'
import type { ThunkDispatch } from '../../types'

export function Landing(): JSX.Element {
  const { t } = useTranslation('shared')
  const dispatch: ThunkDispatch<any> = useDispatch()
  const navigate = useNavigate()
  const loadFile = (
    fileChangeEvent: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (window.confirm(t('confirm_import') as string)) {
      dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
      navigate('/overview')
    }
  }

  return (
    <Flex
      backgroundColor={COLORS.grey20}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      paddingTop="14.875rem"
      height="100vh"
      width="100%"
    >
      <img
        src={welcomeImage}
        height="132px"
        width="548px"
        aria-label="welcome image"
      />
      <StyledText
        desktopStyle="headingLargeBold"
        marginTop={SPACING.spacing16}
        marginBottom={SPACING.spacing16}
      >
        {t('welcome')}
      </StyledText>
      <StyledText
        desktopStyle="headingSmallRegular"
        color={COLORS.grey60}
        maxWidth="34.25rem"
        textAlign={TYPOGRAPHY.textAlignCenter}
      >
        {t('no-code-solution')}
      </StyledText>
      {/* TODO(ja, 8/7/24): replace this with LargeButton https://opentrons.atlassian.net/browse/AUTH-622 */}
      <PrimaryButton margin={SPACING.spacing32}>
        <StyledNavLink to={'/createNew'}>
          <StyledText desktopStyle="bodyLargeRegular">
            {t('create_new')}
          </StyledText>
        </StyledNavLink>
      </PrimaryButton>
      <StyledLabel>
        <StyledText desktopStyle="bodyLargeRegular" color={COLORS.grey60}>
          {t('import_existing')}
        </StyledText>
        <input type="file" onChange={loadFile}></input>
      </StyledLabel>
    </Flex>
  )
}

const StyledLabel = styled.label`
  display: inline-block;
  cursor: pointer;
  input[type='file'] {
    display: none;
  }
`
const StyledNavLink = styled(NavLink)<React.ComponentProps<typeof NavLink>>`
  color: ${COLORS.white};
  text-decoration: none;
`
