import * as React from 'react'

import { DeckSetupTools } from '../DeckSetup/DeckSetupTools'
import { OffDeckDetails } from './OffDeckDetails'

export function OffDeck(): JSX.Element {
  const [toolbox, setToolbox] = React.useState<boolean>(false)

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
          addLabware={() => {
            setToolbox(true)
          }}
        />
      )}
    </>
  )
}
