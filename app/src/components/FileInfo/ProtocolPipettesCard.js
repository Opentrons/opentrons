// @flow
// setup pipettes component
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Icon } from '@opentrons/components'
import {
  PIPETTE_MOUNTS,
  fetchPipettes,
  getProtocolPipettesInfo,
  getProtocolPipettesMatch,
  getSomeProtocolPipettesInexact,
} from '../../pipettes'
import { InstrumentItem } from './InstrumentItem'
import { SectionContentHalf } from '../layout'
import { InfoSection } from './InfoSection'
import { MissingItemWarning } from './MissingItemWarning'

import styles from './styles.css'

import type { State, Dispatch } from '../../types'

export type ProtocolPipettesCardProps = {| robotName: string |}

const inexactPipetteSupportArticle =
  'https://support.opentrons.com/en/articles/3450143-gen2-pipette-compatibility'
const TITLE = 'Required Pipettes'

export function ProtocolPipettesCard(
  props: ProtocolPipettesCardProps
): React.Node {
  const { robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const infoByMount = useSelector((state: State) =>
    getProtocolPipettesInfo(state, robotName)
  )
  const allPipettesMatch = useSelector((state: State) =>
    getProtocolPipettesMatch(state, robotName)
  )
  const someInexactMatches = useSelector((state: State) =>
    getSomeProtocolPipettesInexact(state, robotName)
  )

  React.useEffect(() => {
    dispatch(fetchPipettes(robotName))
  }, [dispatch, robotName])

  const changePipetteUrl = `/robots/${robotName}/instruments`

  const pipetteItemProps = PIPETTE_MOUNTS.map(mount => {
    const info = infoByMount[mount]

    return info.protocol
      ? {
          compatibility: info.compatibility,
          mount: info.protocol.mount,
          hidden: !info.protocol.name,
          displayName: info.protocol.displayName,
        }
      : null
  }).filter(Boolean)

  if (pipetteItemProps.length === 0) return null

  return (
    <InfoSection title={TITLE}>
      <SectionContentHalf>
        {pipetteItemProps.map(itemProps => (
          <InstrumentItem
            key={itemProps.mount}
            compatibility={itemProps.compatibility}
            mount={itemProps.mount}
            hidden={itemProps.hidden}
          >
            {itemProps.displayName}
          </InstrumentItem>
        ))}
      </SectionContentHalf>
      {!allPipettesMatch && (
        <MissingItemWarning
          isBlocking
          instrumentType="pipette"
          url={changePipetteUrl}
        />
      )}
      {allPipettesMatch && someInexactMatches && (
        <SectionContentHalf className={styles.soft_warning}>
          <div className={styles.warning_info_wrapper}>
            <Icon name="information" className={styles.info_icon} />
            <span>Inexact pipette match,</span>
            <a
              href={inexactPipetteSupportArticle}
              target="_blank"
              rel="noopener noreferrer"
            >
              &nbsp; learn more
            </a>
            <span>.</span>
          </div>
        </SectionContentHalf>
      )}
    </InfoSection>
  )
}
