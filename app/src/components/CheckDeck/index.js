// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { ContextRouter } from 'react-router-dom'
import { ModalPage } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import { fetchDeckCheckSession, getDeckCheckSession } from '../../calibration'

// import { createLogger } from '../../logger'

// const log = createLogger(__filename)

const DECK_CHECK_SUBTITLE = 'Check deck calibration'

type CheckDeckProps = {|
  ...ContextRouter,
  robotName: string,
|}
export function CheckDeck(props: CheckDeckProps) {
  const { robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const deckCheckSessionData = useSelector((state: State) =>
    getDeckCheckSession(state, robotName)
  )
  React.useEffect(() => {
    dispatch(fetchDeckCheckSession(robotName))
  }, [dispatch, robotName])

  function exit() {
    console.log('TODO: exit')
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
