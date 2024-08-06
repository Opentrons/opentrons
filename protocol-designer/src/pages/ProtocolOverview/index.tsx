import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, PrimaryButton, SPACING } from '@opentrons/components'
import { DeckSetup } from './DeckSetup'

export function ProtocolOverview(): JSX.Element {
  const { t } = useTranslation('protocol_overview')
  const [deckSetup, setDeckSetup] = React.useState<boolean>(false)

  return deckSetup ? (
    <DeckSetup
      onCancel={() => {
        setDeckSetup(false)
      }}
      onSave={() => {
        setDeckSetup(false)
      }}
    />
  ) : (
    <Flex gridGap={SPACING.spacing16}>
      {t('protocol_overview')}
      <PrimaryButton
        onClick={() => {
          setDeckSetup(true)
        }}
      >
        go to deck setup
      </PrimaryButton>
    </Flex>
  )
}
