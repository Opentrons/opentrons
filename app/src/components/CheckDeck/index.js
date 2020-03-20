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
import { createLogger } from '../../logger'

import { CompleteConfirmation } from './CompleteConfirmation'
import styles from './styles.css'

const log = createLogger(__filename)

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

  log.info('deck check session data: ', deckCheckSessionData || {})
  return (
    <ModalPage
      titleBar={{
        title: DECK_CHECK_SUBTITLE,
        back: { onClick: exit },
      }}
      contentsClassName={styles.modal_contents}
    >
      <CompleteConfirmation robotName={robotName} exit={exit} />
    </ModalPage>
  )
}
