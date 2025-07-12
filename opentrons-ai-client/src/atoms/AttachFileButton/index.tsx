import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import {
  BORDERS,
  COLORS,
  Icon,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

interface AttachFileButtonProps {
  onFileSelect: (files: FileList) => void
  disabled?: boolean
}

export function AttachFileButton({
  onFileSelect,
  disabled = false,
}: AttachFileButtonProps): JSX.Element {
  const { t } = useTranslation('protocol_generator')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = (): void => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files)
      // Reset input to allow re-selecting same file
      e.target.value = ''
    }
  }

  return (
    <>
      <StyledButton
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={t('attach_file')}
      >
        <Icon name="paper-clip" size="1rem" />
        <ButtonText>{t('attach_file')}</ButtonText>
      </StyledButton>
      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.py"
        onChange={handleFileChange}
      />
    </>
  )
}

const StyledButton = styled.button<{ disabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${SPACING.spacing8};
  background: transparent;
  border: 1px solid ${COLORS.blue50};
  border-radius: ${BORDERS.borderRadius8};
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.disabled ? 0.5 : 1)};
  padding: ${SPACING.spacing8} ${SPACING.spacing12};
  color: ${COLORS.blue50};
  transition: all 0.2s ease;
  height: ${SPACING.spacing36};
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${COLORS.blue10};
    border-color: ${COLORS.blue60};
    color: ${COLORS.blue60};
  }

  &:focus {
    outline: none;
    background: ${COLORS.blue10};
    border-color: ${COLORS.blue60};
    box-shadow: 0 0 0 ${SPACING.spacing2} ${COLORS.blue50}20;
  }
`

const ButtonText = styled.span`
  font-size: ${TYPOGRAPHY.fontSizeH3};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  line-height: ${TYPOGRAPHY.lineHeight20};
  color: inherit;
  text-align: center;
  font-family: 'Public Sans';
  font-style: normal;
`

const HiddenFileInput = styled.input`
  display: none;
`
