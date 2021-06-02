import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Splash } from '@opentrons/components'
import { Page } from '../../atoms/Page'

export function ProtocolUpload(): JSX.Element {
  const { t } = useTranslation('protocol_info')

  const titleBarProps = { title: t('upload_and_simulate') }

  return (
    <Page titleBarProps={titleBarProps}>
      <Splash />
    </Page>
  )
}
