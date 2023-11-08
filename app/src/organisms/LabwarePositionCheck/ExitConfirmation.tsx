import * as React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Icon,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  SPACING,
  SIZE_3,
  AlertPrimaryButton,
  JUSTIFY_CENTER,
  COLORS,
  TYPOGRAPHY,
  RESPONSIVENESS,
  SecondaryButton,
  JUSTIFY_FLEX_END,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { useSelector } from 'react-redux'
import { getIsOnDevice } from '../../redux/config'
import { SmallButton } from '../../atoms/buttons'

interface ExitConfirmationProps {
  onGoBack: () => void
  onConfirmExit: () => void
}

export const ExitConfirmation = (props: ExitConfirmationProps): JSX.Element => {
  const { i18n, t } = useTranslation(['labware_position_check', 'shared'])
  const { onGoBack, onConfirmExit } = props
  const isOnDevice = useSelector(getIsOnDevice)
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      padding={SPACING.spacing32}
      minHeight="29.5rem"
    >
      <Flex
        flex="1"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        paddingX={SPACING.spacing32}
      >
        <Icon name="ot-alert" size={SIZE_3} color={COLORS.warningEnabled} />
        {isOnDevice ? (
          <>
            <ConfirmationHeaderODD>
              {t('exit_screen_title')}
            </ConfirmationHeaderODD>
            <Flex textAlign={TEXT_ALIGN_CENTER}>
              <ConfirmationBodyODD>
                {t('exit_screen_subtitle')}
              </ConfirmationBodyODD>
            </Flex>
          </>
        ) : (
          <>
            <ConfirmationHeader>{t('exit_screen_title')}</ConfirmationHeader>
            <StyledText as="p" marginTop={SPACING.spacing8}>
              {t('exit_screen_subtitle')}
            </StyledText>
          </>
        )}
      </Flex>
      {isOnDevice ? (
        <Flex
          width="100%"
          justifyContent={JUSTIFY_FLEX_END}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing8}
        >
          <SmallButton
            onClick={onGoBack}
            buttonText={i18n.format(t('shared:go_back'), 'capitalize')}
            buttonType="secondary"
          />
          <SmallButton
            onClick={onConfirmExit}
            buttonText={i18n.format(t('shared:exit'), 'capitalize')}
            buttonType="alert"
          />
        </Flex>
      ) : (
        <Flex
          width="100%"
          marginTop={SPACING.spacing32}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          <Flex gridGap={SPACING.spacing8}>
            <SecondaryButton onClick={onGoBack}>
              {t('shared:go_back')}
            </SecondaryButton>
            <AlertPrimaryButton
              onClick={onConfirmExit}
              textTransform={TYPOGRAPHY.textTransformCapitalize}
            >
              {t('shared:exit')}
            </AlertPrimaryButton>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}

const ConfirmationHeader = styled.h1`
  margin-top: ${SPACING.spacing24};
  ${TYPOGRAPHY.level3HeaderSemiBold}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`

const ConfirmationHeaderODD = styled.h1`
  margin-top: ${SPACING.spacing24};
  ${TYPOGRAPHY.level3HeaderBold}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`
const ConfirmationBodyODD = styled.h1`
  ${TYPOGRAPHY.level4HeaderRegular}
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderRegular}
  }
  color: ${COLORS.darkBlack70};
`
