import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, PrimaryButton, SPACING } from '@opentrons/components'
import { useNavigate } from 'react-router-dom'

export function ProtocolOverview(): JSX.Element {
  const { t } = useTranslation('protocol_overview')
  const navigate = useNavigate()

  return (
    <Flex gridGap={SPACING.spacing16}>
      {t('protocol_overview')}
      <PrimaryButton
        onClick={() => {
          navigate('/startingDeckState')
        }}
      >
        go to deck setup
      </PrimaryButton>
    </Flex>
  )
}
