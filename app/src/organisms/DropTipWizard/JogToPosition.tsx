import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  ALIGN_CENTER,
  RESPONSIVENESS,
  JUSTIFY_SPACE_BETWEEN,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  ALIGN_FLEX_START,
  TYPOGRAPHY,
} from '@opentrons/components'
import { NeedHelpLink } from '../CalibrationPanels'
import { TwoUpTileLayout } from '../LabwarePositionCheck/TwoUpTileLayout'
import { useSelector } from 'react-redux'
import { getIsOnDevice } from '../../redux/config'
import { SmallButton } from '../../atoms/buttons'
import { Jog, JogControls } from '../../molecules/JogControls'
import { Portal } from '../../App/portal'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { StyledText } from '../../atoms/text'

// TODO: get help link article URL
const NEED_HELP_URL = ''

const Header = styled.h1`
  ${TYPOGRAPHY.h1Default}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`

interface JogToPositionProps {
  handleProceed: () => void
  handleGoBack: () => void
  handleJog: Jog
  body: string
}

export const JogToPosition = (
  props: JogToPositionProps
): JSX.Element | null => {
  const { handleProceed, handleGoBack, handleJog, body } = props
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])
  const isOnDevice = useSelector(getIsOnDevice)
  const [showFullJogControls, setShowFullJogControls] = React.useState(false)

  const handleConfirmPosition = () => {
    console.log('TODO: handle confirm position and show confirm screen')
    handleProceed()
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="29.5rem"
    >
      <Flex gridGap={SPACING.spacing24}>
        <Flex
          flex="1"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_FLEX_START}
        >
          <Header>
            {i18n.format(t('position_the_pipette'), 'capitalize')}
          </Header>
          {body}
        </Flex>
        <Flex flex="1" alignItems={ALIGN_CENTER} gridGap={SPACING.spacing20}>
          <img width="89px" height="145px" />
        </Flex>
      </Flex>
      {isOnDevice ? (
        <Flex
          width="100%"
          marginTop={SPACING.spacing32}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          <SmallButton
            buttonType="tertiaryLowLight"
            buttonText={t('shared:go_back')}
            onClick={handleGoBack}
          />
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            <SmallButton
              buttonType="secondary"
              buttonText={t('move_pipette')}
              onClick={() => {
                setShowFullJogControls(true)
              }}
            />
            <SmallButton
              buttonText={t('shared:confirm_position')}
              onClick={handleConfirmPosition}
            />
          </Flex>
          <Portal level="top">
            {showFullJogControls ? (
              <LegacyModalShell
                width="60rem"
                height="33.5rem"
                padding={SPACING.spacing32}
                display="flex"
                flexDirection={DIRECTION_COLUMN}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                header={
                  <StyledText
                    as="h4"
                    css={css`
                      font-weight: ${TYPOGRAPHY.fontWeightBold};
                      font-size: ${TYPOGRAPHY.fontSize28};
                      line-height: ${TYPOGRAPHY.lineHeight36};
                    `}
                  >
                    {t('move_to_a1_position')}
                  </StyledText>
                }
                footer={
                  <SmallButton
                    width="100%"
                    textTransform={TYPOGRAPHY.textTransformCapitalize}
                    buttonText={t('shared:close')}
                    onClick={() => {
                      setShowFullJogControls(false)
                    }}
                  />
                }
              >
                <JogControls jog={handleJog} isOnDevice={true} />
              </LegacyModalShell>
            ) : null}
          </Portal>
        </Flex>
      ) : (
        <>
          <JogControls jog={handleJog} />
          <Flex
            width="100%"
            marginTop={SPACING.spacing32}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <NeedHelpLink href={NEED_HELP_URL} />
            <Flex gridGap={SPACING.spacing8}>
              <SecondaryButton onClick={handleGoBack}>
                {t('shared:go_back')}
              </SecondaryButton>
              <PrimaryButton onClick={handleConfirmPosition}>
                {t('shared:confirm_position')}
              </PrimaryButton>
            </Flex>
          </Flex>
        </>
      )}
    </Flex>
  )
}
