import * as React from 'react'

import {
  Icon,
  Text,
  PrimaryBtn,
  SecondaryBtn,
  FONT_HEADER_DARK,
  FONT_SIZE_BODY_2,
  FONT_WEIGHT_REGULAR,
  SPACING_3,
  SPACING_4,
  SPACING_5,
  C_MED_LIGHT_GRAY,
  C_MED_GRAY,
  SIZE_3,
  Link,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
} from '@opentrons/components'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

const PROTOCOL_LIBRARY_URL = "https://protocols.opentrons.com"
const PROTOCOL_DESIGNER_URL = "https://designer.opentrons.com"

const DROP_ZONE_STYLES = css`
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  width: 50%;
  font-size: ${FONT_SIZE_BODY_2};
  font-weight: ${FONT_WEIGHT_REGULAR};
  padding: ${SPACING_5};
  border: 2px dashed ${C_MED_LIGHT_GRAY};
  border-radius: 6px;
  color: ${C_MED_GRAY};
  text-align: center;
  margin-bottom: ${SPACING_4};
`

export interface UploadInputProps {
  filename: string | null | undefined
  sessionLoaded: boolean | null | undefined
  createSession: (file: File) => unknown
}

export function UploadInput (props: UploadInputProps): JSX.Element {
  const { t } = useTranslation('protocol_info')
  const hiddenFileInput = React.useRef(null)
  const [uploadedFile, setUploadedFile] = React.useState<File | null | undefined>()

  const onDrop: React.DragEventHandler<HTMLLabelElement> = (event) => {
    const {files = []} = 'dataTransfer' in event ? event.dataTransfer: {}

    if (props.sessionLoaded) {
      setUploadedFile(files[0])
    } else {
      props.createSession(files[0])
    }
  }

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (
    _event
  ) => {
    if (hiddenFileInput.current !== null) {
      hiddenFileInput.current.click()
    }
  }
  const onChange: React.ChangeEventHandler<HTMLInputElement> = (
    event
  )=> {
    const { files = [] } = event.target ?? {}

    if (props.sessionLoaded) {
      setUploadedFile(files?.[0])
    } else {
      props.createSession(files?.[0])
    }

    if ('value' in event.currentTarget) event.currentTarget.value = ''
  }

  return (
    <>
      <Text css={FONT_HEADER_DARK} marginBottom={SPACING_3}>{t('open_a_protocol')}</Text>
      <PrimaryBtn onClick={handleClick} marginBottom={SPACING_4}>{t('choose_file')}</PrimaryBtn>
      <input type="file" ref={hiddenFileInput} onChange={onChange} style={{display: 'none'}}/>
      <label onDrop={onDrop} css={DROP_ZONE_STYLES}>
        <Icon width={SIZE_3} name="upload" marginBottom={SPACING_4} />
        {t('drag_file_here')}
        <input style={{position: 'fixed', clip: 'rect(1px 1px 1px 1px)'}} type="file" onChange={onChange} />
      </label>
      <Text css={FONT_HEADER_DARK} marginBottom={SPACING_4}>{t('no_protocol_yet')}</Text>
      <SecondaryBtn as={Link} external href={PROTOCOL_LIBRARY_URL} width='19rem' marginBottom={SPACING_3} >
        {t('browse_protocol_library')}
      </SecondaryBtn>
      <SecondaryBtn as={Link} external href={PROTOCOL_DESIGNER_URL} width='19rem'>
        {t('launch_protocol_designer')}
      </SecondaryBtn>
    </>
  )
}
