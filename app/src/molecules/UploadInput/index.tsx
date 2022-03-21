import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import {
  Icon,
  Flex,
  Link,
  SPACING,
  BORDERS,
  COLORS,
  SIZE_3,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import { PrimaryButton } from '../../atoms/Buttons'
import { StyledText } from '../../atoms/text'

const DROP_ZONE_STYLES = css`
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  width: 100%;
  padding: ${SPACING.spacing6};
  border: 2px dashed ${COLORS.medGrey};
  border-radius: ${BORDERS.radiusSoftCorners};
  text-align: center;
  background-color: ${COLORS.white};
`
const DRAG_OVER_STYLES = css`
  background-color: ${COLORS.lightBlue};
  border: 2px dashed ${COLORS.blue};
`

const INPUT_STYLES = css`
  position: fixed;
  clip: rect(1px 1px 1px 1px);
`

export interface UploadInputProps {
  onUpload: (file: File) => unknown
  onClick?: () => void
  uploadText?: string
}

export function UploadInput(props: UploadInputProps): JSX.Element | null {
  const { t } = useTranslation('protocol_info')

  const fileInput = React.useRef<HTMLInputElement>(null)
  const [isFileOverDropZone, setIsFileOverDropZone] = React.useState<boolean>(
    false
  )
  const handleDrop: React.DragEventHandler<HTMLLabelElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    const { files = [] } = 'dataTransfer' in e ? e.dataTransfer : {}
    console.log('files', files[0])
    props.onUpload(files[0])
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
  }
  const handleDragOver: React.DragEventHandler<HTMLLabelElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsFileOverDropZone(true)
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = _event => {
    props.onClick != null ? props.onClick() : fileInput.current?.click()
  }

  const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const { files = [] } = event.target ?? {}
    files?.[0] && props.onUpload(files?.[0])
    if ('value' in event.currentTarget) event.currentTarget.value = ''
  }

  const dropZoneStyles = isFileOverDropZone
    ? css`
        ${DROP_ZONE_STYLES} ${DRAG_OVER_STYLES}
      `
    : DROP_ZONE_STYLES

  return (
    <Flex
      height="100%"
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      gridGap={SPACING.spacing5}
    >
      <StyledText as="p">{props.uploadText}</StyledText>
      <PrimaryButton
        onClick={handleClick}
        id={'UploadInput_protocolUploadButton'}
      >
        {t('choose_protocol_file')}
      </PrimaryButton>

      <label
        data-testid="file_drop_zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        css={dropZoneStyles}
      >
        <Icon
          width={SIZE_3}
          color={COLORS.darkGreyEnabled}
          name="upload"
          marginBottom={SPACING.spacing5}
        />
        <StyledText as="p">
          Drag and drop or{' '}
          <Link color={COLORS.blue} onClick={handleClick} role="button">
            browse
          </Link>{' '}
          your files
        </StyledText>
        <input
          id="file_input"
          data-testid="file_input"
          ref={fileInput}
          css={INPUT_STYLES}
          type="file"
          onChange={onChange}
        />
      </label>
    </Flex>
  )
}
