// @flow
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { push } from 'connected-react-router'
import { ModalPage, Icon } from '@opentrons/components'
import type { State, Dispatch } from '../../types'
import {
  fetchDeckCheckSession,
  endDeckCheckSession,
  getDeckCheckSession,
} from '../../calibration'
import styles from './styles.css'

// import { createLogger } from '../../logger'

// const log = createLogger(__filename)

const DECK_CHECK_SUBTITLE = 'Check deck calibration'

const END_DECK_CHECK_HEADER = 'Calibration check is complete'
const END_DECK_CHECK_BODY =
  "You have successfully checked the accuracy of this robot's calibration."

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
        title: DECK_CHECK_SUBTITLE,
        back: { onClick: exit },
      }}
      contentsClassName={styles.modal_contents}
    >
      <div className={styles.modal_header}>
        <Icon name="check-circle" className={styles.status_icon} />
        <h3>{END_DECK_CHECK_HEADER}</h3>
      </div>
      <p>{END_DECK_CHECK_BODY}</p>
    </ModalPage>
  )
}
