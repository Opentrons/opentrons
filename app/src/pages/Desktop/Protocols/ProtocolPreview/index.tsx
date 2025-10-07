import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import { COLORS, Icon } from '@opentrons/components'

import {
  fetchProtocols,
  getStoredProtocol,
  getStoredProtocolGroupedCommands,
} from '/app/redux/protocol-storage'

import styles from './preview.module.css'
import { PreviewContainer } from './PreviewContainer'

import type { DesktopRouteParams } from '/app/App/types'
import type { Dispatch, State } from '/app/redux/types'

export function ProtocolPreview(): JSX.Element {
  const { protocolKey } = useParams<
    keyof DesktopRouteParams
  >() as DesktopRouteParams
  const dispatch = useDispatch<Dispatch>()
  const storedProtocol = useSelector((state: State) =>
    getStoredProtocol(state, protocolKey)
  )
  const groupedCommands = useSelector((state: State) =>
    getStoredProtocolGroupedCommands(state, protocolKey)
  )
  useEffect(() => {
    dispatch(fetchProtocols())
  }, [])

  return storedProtocol != null && storedProtocol.mostRecentAnalysis != null ? (
    <PreviewContainer
      analysis={storedProtocol.mostRecentAnalysis}
      groupedCommands={groupedCommands}
      protocolKey={protocolKey}
      srcFileNames={storedProtocol.srcFileNames}
    />
  ) : (
    <div className={styles.loading_icon}>
      <Icon size="8rem" name="ot-spinner" spin color={COLORS.blue50} />
    </div>
  )
}
