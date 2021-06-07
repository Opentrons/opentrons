import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  C_NEAR_WHITE,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { Page } from '../../atoms/Page'
import { UploadInput } from './UploadInput'

export function ProtocolUpload(): JSX.Element {
  const { t } = useTranslation('protocol_info')

  const titleBarProps = { title: t('upload_and_simulate') }

  return (
    <Page titleBarProps={titleBarProps}>
      <Flex
        height="100%"
        width="100%"
        backgroundColor={C_NEAR_WHITE}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <UploadInput
          createSession={file => {
            console.log('TODO: create HTTP protocol session', file)
          }}
        />
      </Flex>
    </Page>
  )
}
