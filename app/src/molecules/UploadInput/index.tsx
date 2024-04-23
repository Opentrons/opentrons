import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  PrimaryButton,
  SIZE_3,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

const StyledLabel = styled.label`
  display: flex;
  cursor: pointer;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  width: 100%;
  padding: ${SPACING.spacing32};
  border: 2px dashed ${COLORS.grey30};
  border-radius: ${BORDERS.borderRadius4};
  text-align: center;
  background-color: ${COLORS.white};

  &:hover,
  &:focus-within {
    border: 2px dashed ${COLORS.blue50};
  }
`
const DRAG_OVER_STYLES = css`
  border: 2px dashed ${COLORS.blue50};
`

const StyledInput = styled.input`
  position: fixed;
  clip: rect(1px 1px 1px 1px);
`

export interface UploadInputProps {
  onUpload: (file: File) => unknown
  onClick?: () => void
  uploadButtonText?: string
  uploadText?: string | JSX.Element
  dragAndDropText?: string | JSX.Element
}

export function UploadInput(props: UploadInputProps): JSX.Element | null {
  const {
    dragAndDropText,
    onClick,
    onUpload,
    uploadButtonText,
    uploadText,
  } = props
  const { t } = useTranslation('protocol_info')

  const fileInput = React.useRef<HTMLInputElement>(null)
  const [isFileOverDropZone, setIsFileOverDropZone] = React.useState<boolean>(
    false
  )
  const [isHover, setIsHover] = React.useState<boolean>(false)
  const handleDrop: React.DragEventHandler<HTMLLabelElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    Array.from(e.dataTransfer.files).forEach(f => onUpload(f))
    setIsFileOverDropZone(false)
  }
  const handleDragEnter: React.DragEventHandler<HTMLLabelElement> = e => {
    e.preventDefault()
    e.stopPropagation()
  }
  const handleDragLeave: React.DragEventHandler<HTMLLabelElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsFileOverDropZone(false)
    setIsHover(false)
  }
  const handleDragOver: React.DragEventHandler<HTMLLabelElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsFileOverDropZone(true)
    setIsHover(true)
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = _event => {
    onClick != null ? onClick() : fileInput.current?.click()
  }

  const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    ;[...(event.target.files ?? [])].forEach(f => onUpload(f))
    if ('value' in event.currentTarget) event.currentTarget.value = ''
  }

  return (
    <Flex
      height="100%"
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      gridGap={SPACING.spacing24}
    >
      {uploadText != null ? (
        <StyledText
          as="p"
          textAlign={TYPOGRAPHY.textAlignCenter}
          marginTop={SPACING.spacing16}
        >
          {uploadText}
        </StyledText>
      ) : null}
      <PrimaryButton
        onClick={handleClick}
        id="UploadInput_protocolUploadButton"
      >
        {uploadButtonText ?? t('upload')}
      </PrimaryButton>

      <StyledLabel
        data-testid="file_drop_zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        css={isFileOverDropZone ? DRAG_OVER_STYLES : undefined}
      >
        <Icon
          width={SIZE_3}
          color={isHover ? COLORS.blue50 : COLORS.grey60}
          name="upload"
          marginBottom={SPACING.spacing24}
        />
        {dragAndDropText}
        <StyledInput
          id="file_input"
          data-testid="file_input"
          ref={fileInput}
          type="file"
          onChange={onChange}
          multiple
        />
      </StyledLabel>
    </Flex>
  )
}
