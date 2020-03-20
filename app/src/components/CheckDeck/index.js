// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { push } from 'connected-react-router'
import { ModalPage } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import {
  fetchDeckCheckSession,
  endDeckCheckSession,
  getDeckCheckSession,
} from '../../calibration'

// import { createLogger } from '../../logger'

// const log = createLogger(__filename)

const DECK_CHECK_SUBTITLE = 'Check deck calibration'

type CheckDeckProps = {|
  parentUrl: string,
  robotName: string,
|}
export function CheckDeck(props: CheckDeckProps) {
  const { robotName, parentUrl } = props
  const dispatch = useDispatch<Dispatch>()
  const deckCheckSessionData = useSelector((state: State) =>
    getDeckCheckSession(state, robotName)
  )
  React.useEffect(() => {
    dispatch(fetchDeckCheckSession(robotName))
  }, [dispatch, robotName])

  function exit() {
    dispatch(endDeckCheckSession(robotName))
    dispatch(push(parentUrl))
  }
  console.table({ deckCheckSessionData })
  return (
    <ModalPage
      titleBar={{
        subtitle: DECK_CHECK_SUBTITLE,
        back: { onClick: exit },
      }}
    >
      <div>DID IT!</div>
    </ModalPage>
  )
}
