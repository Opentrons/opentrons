import * as React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LargeButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { BUTTON_LINK_STYLE } from '../../atoms'
import { actions as loadFileActions } from '../../load-file'
import { getFileMetadata } from '../../file-data/selectors'
import { toggleNewProtocolModal } from '../../navigation/actions'
import welcomeImage from '../../assets/images/welcome_page.png'
import type { ThunkDispatch } from '../../types'

export function Landing(): JSX.Element {
  const { t } = useTranslation('shared')
  const dispatch: ThunkDispatch<any> = useDispatch()
  const metadata = useSelector(getFileMetadata)
  const navigate = useNavigate()

  React.useEffect(() => {
    if (metadata?.created != null) {
      console.warn('protocol already exists, navigating to overview')
      navigate('/overview')
    }
  }, [metadata, navigate])

  const loadFile = (
    fileChangeEvent: React.ChangeEvent<HTMLInputElement>
  ): void => {
    dispatch(loadFileActions.loadProtocolFile(fileChangeEvent))
  }

  return (
    <Flex
      backgroundColor={COLORS.grey20}
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      paddingTop="14.875rem"
      height="calc(100vh - 48px)"
      width="100%"
    >
      <img
        src={welcomeImage}
        height="132px"
        width="548px"
        aria-label="welcome image"
      />
      <StyledText desktopStyle="headingLargeBold" marginY={SPACING.spacing16}>
        {t('welcome')}
      </StyledText>
      <StyledText
        desktopStyle="headingSmallRegular"
        color={COLORS.grey60}
        maxWidth="34.25rem"
        textAlign={TYPOGRAPHY.textAlignCenter}
      >
        {t('no-code-required')}
      </StyledText>
      <LargeButton
        onClick={() => {
          dispatch(toggleNewProtocolModal(true))
        }}
        marginY={SPACING.spacing32}
        buttonText={
          <StyledNavLink to={'/createNew'}>
            <StyledText desktopStyle="bodyLargeRegular">
              {t('create_a_protocol')}
            </StyledText>
          </StyledNavLink>
        }
      />

      <StyledLabel>
        <Flex css={BUTTON_LINK_STYLE}>
          <StyledText desktopStyle="bodyLargeRegular">
            {t('edit_existing')}
          </StyledText>
        </Flex>
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
