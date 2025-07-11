import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  BORDERS,
  COLORS,
  Icon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

interface SendButtonProps {
  handleClick: () => void
  disabled?: boolean
  isLoading?: boolean
}

export function SendButton({
  handleClick,
  disabled = false,
  isLoading = false,
}: SendButtonProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')

  const progressTexts = [
    t('progressInitializing'),
    t('progressProcessing'),
    t('progressGenerating'),
    t('progressFinalizing'),
  ]

  const [buttonText, setButtonText] = useState(progressTexts[0])
  const [, setProgressIndex] = useState(0)

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgressIndex(prevIndex => {
          let newIndex = prevIndex + 1
          if (newIndex > progressTexts.length - 1) {
            newIndex = progressTexts.length - 1
          }
          return newIndex
        })
      }, 10000)

      return () => {
        setProgressIndex(0)
        setButtonText(progressTexts[0])
        clearInterval(interval)
      }
    }
  }, [isLoading])

  return (
    <StyledSendButton
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label="Send"
    >
      <SendIcon />
      <ButtonText>{isLoading ? buttonText : 'Send'}</ButtonText>
      {isLoading && (
        <LoadingIcon>
          <Icon
            name="ot-spinner"
            spin={true}
            size="1rem"
            color={COLORS.white}
          />
        </LoadingIcon>
      )}
    </StyledSendButton>
  )
}

const StyledSendButton = styled.button<{ disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.spacing8};
  width: 5.6875rem;
  height: 2.25rem;
  background-color: ${props =>
    props.disabled ? COLORS.grey35 : COLORS.blue50};
  border: none;
  border-radius: ${BORDERS.borderRadius8};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.disabled ? 0.6 : 1)};
  transition: all 0.2s ease;
  padding: 0 ${SPACING.spacing12};

  &:hover:not(:disabled) {
    background-color: ${COLORS.blue60};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 ${SPACING.spacing2} ${COLORS.blue50}40;
  }

  &:active:not(:disabled) {
    background-color: ${COLORS.blue70};
  }
`

const SendIcon = (): JSX.Element => (
  <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
    <path
      d="M16 6.99902L0.325195 13.6309V0.367188L16 6.99902ZM1.8252 5.74902L5.5752 6.99902L1.8252 7.83203V11.3672L12.1504 6.99902L1.8252 2.62988V5.74902Z"
      fill="white"
    />
  </svg>
)

const ButtonText = styled.span`
  font-size: ${TYPOGRAPHY.fontSizeH3};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight20};
  color: ${COLORS.white};
  text-align: center;
  font-family: 'Public Sans';
  font-style: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const LoadingIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: ${SPACING.spacing4};
`
