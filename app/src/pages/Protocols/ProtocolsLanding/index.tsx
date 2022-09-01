import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchProtocols,
  getStoredProtocols,
} from '../../../redux/protocol-storage'
import { ProtocolsEmptyState } from '../../../organisms/ProtocolsLanding/ProtocolsEmptyState'
import { ProtocolList } from '../../../organisms/ProtocolsLanding/ProtocolList'

import type { Dispatch, State } from '../../../redux/types'

export function ProtocolsLanding(): JSX.Element {
  const dispatch = useDispatch<Dispatch>()
  const storedProtocols = useSelector((state: State) =>
    getStoredProtocols(state)
  )
  React.useEffect(() => {
    dispatch(fetchProtocols())
  }, [dispatch])

  return (
    <>
      <iframe
        src="https://codesandbox.io/embed/interact-js-test-components-d5vxxu?fontsize=14&hidenavigation=1&theme=dark&view=preview"
        width="600"
        height="600"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {storedProtocols.length > 0 ? (
        <ProtocolList storedProtocols={storedProtocols} />
      ) : (
        <ProtocolsEmptyState />
      )}
    </>
  )
}
