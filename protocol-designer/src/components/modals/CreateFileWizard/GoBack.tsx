import * as React from 'react'
import { Btn, Text, TYPOGRAPHY } from '@opentrons/components'
import { i18n } from '../../../localization'

interface GoBackProps {
  onClick: React.MouseEventHandler
}

export function GoBack(props: GoBackProps): JSX.Element {
  const { onClick } = props

  return (
    <Btn
      aria-label="GoBack_button"
      css={TYPOGRAPHY.darkLinkH4SemiBold}
      onClick={onClick}
    >
      <Text>{i18n.t('application.go_back')}</Text>
    </Btn>
  )
}
