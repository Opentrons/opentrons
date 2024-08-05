import { Btn } from '@opentrons/components'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
    <div>
      {t('protocol_overview')}
      <Btn
        onClick={() => {
          setDeckSetup(true)
        }}
      >
        go to deck setup
      </Btn>
    </div>
  )
}
