import * as React from 'react'

import { DeckSetupTools } from '../DeckSetup/DeckSetupTools'
import { OffDeckDetails } from './OffDeckDetails'
import type { DeckSlotId } from '@opentrons/shared-data'

export function OffDeck(): JSX.Element {
  const [toolbox, setToolbox] = React.useState<boolean>(false)
  const [hoverSlot, setHoverSlot] = React.useState<DeckSlotId | null>(null)

  return (
    <>
      {toolbox ? (
        <DeckSetupTools
          onCloseClick={() => {
            setToolbox(false)
          }}
          slot="offDeck"
        />
      ) : (
        <OffDeckDetails
          setHover={setHoverSlot}
          hover={hoverSlot}
          addLabware={() => {
            setToolbox(true)
          }}
          onClick={() => {
            setToolbox(true)
          }}
        />
      )}
    </>
  )
}
