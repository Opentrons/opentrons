import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Btn, Text } from '@opentrons/components'

interface GoBackProps {
  onClick: React.MouseEventHandler
}

export function GoBack(props: GoBackProps): JSX.Element {
  const { onClick } = props
  const { t } = useTranslation('shared')
  return (
    <Btn onClick={onClick}>
      <Text>{t('go_back')}</Text>
    </Btn>
  )
}
