import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Btn, Text, TYPOGRAPHY } from '@opentrons/components'

interface GoBackProps {
  onClick: React.MouseEventHandler
}

export function GoBack(props: GoBackProps): JSX.Element {
  const { onClick } = props
  const { t } = useTranslation('application')
  return (
    <Btn
      aria-label="GoBack_button"
      css={TYPOGRAPHY.darkLinkH4SemiBold}
      onClick={onClick}
    >
      <Text>{t('go_back')}</Text>
    </Btn>
  )
}
