import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  Icon,
  Text,
  Flex,
  NewPrimaryBtn,
  FONT_SIZE_BODY_1,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_REGULAR,
  TEXT_TRANSFORM_CAPITALIZE,
  SPACING_4,
  SPACING_5,
  C_MED_LIGHT_GRAY,
  C_MED_GRAY,
  SIZE_3,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
  C_WHITE,
  JUSTIFY_CENTER,
  C_BLUE,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'

import { addProtocol } from '../../redux/protocol-storage'

import type { Dispatch } from '../../redux/types'
import { useLogger } from '../../logger'

const DROP_ZONE_STYLES = css`
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  width: 100%;
  font-size: ${FONT_SIZE_BODY_2};
  font-weight: ${FONT_WEIGHT_REGULAR};
  padding: ${SPACING_5};
  border: 2px dashed ${C_MED_LIGHT_GRAY};
  border-radius: 6px;
  color: ${C_MED_GRAY};
  text-align: center;
  margin-bottom: ${SPACING_4};
  background-color: ${C_WHITE};
`
const DRAG_OVER_STYLES = css`
  background-color: ${C_BLUE};
  color: ${C_WHITE};
`

const INPUT_STYLES = css`
  position: fixed;
  clip: rect(1px 1px 1px 1px);
`

export interface UploadInputProps {
  onUpload?: () => unknown
}

// TODO(bc, 2022-3-21): consider making this generic for any file upload and adding it to molecules/organisms with onUpload taking the files from the event
export function UploadInput(props: UploadInputProps): JSX.Element | null {
  const { t } = useTranslation('protocol_info')
  const dispatch = useDispatch<Dispatch>()
  const logger = useLogger(__filename)

  const fileInput = React.useRef<HTMLInputElement>(null)
  const [isFileOverDropZone, setIsFileOverDropZone] = React.useState<boolean>(
    false
  )

  const handleUpload = (path: string | null): void => {
    if (path === null) logger.warn('Failed to upload file, path not found')
    else {
      dispatch(addProtocol(path))
      props.onUpload && props.onUpload()
    }
  }
  const handleDrop: React.DragEventHandler<HTMLLabelElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    const { files = [] } = 'dataTransfer' in e ? e.dataTransfer : {}
    handleUpload(files[0]?.path ?? null)
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
    fileInput.current?.click()
  }

  const onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const { files = [] } = event.target ?? {}
    handleUpload(files?.[0]?.path ?? null)
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
    >
      <Text
        fontSize={FONT_SIZE_BODY_1}
        textAlign={TEXT_ALIGN_CENTER}
        marginY="1.5rem"
      >
        {t('valid_file_types')}
      </Text>
      <NewPrimaryBtn
        onClick={handleClick}
        marginBottom={SPACING_4}
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        id={'UploadInput_protocolUploadButton'}
      >
        {t('choose_protocol_file')}
      </NewPrimaryBtn>

      <label
        data-testid="file_drop_zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        css={dropZoneStyles}
      >
        <Icon width={SIZE_3} name="upload" marginBottom={SPACING_4} />

        <span
          aria-controls="file_input"
          role="button"
          id={'UploadInput_fileUploadLabel'}
        >
          {t('drag_file_here')}
        </span>

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
