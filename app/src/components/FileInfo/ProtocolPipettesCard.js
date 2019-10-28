// @flow
// setup pipettes component
import * as React from 'react'
import { useDispatch } from 'react-redux'
import every from 'lodash/every'
import some from 'lodash/some'

import { Icon } from '@opentrons/components'
import { constants as robotConstants } from '../../robot'
import { fetchPipettes } from '../../robot-api'
import InstrumentItem from './InstrumentItem'
import { SectionContentHalf } from '../layout'
import InfoSection from './InfoSection'
import MissingItemWarning from './MissingItemWarning'
import useInstrumentMountInfo from './useInstrumentMountInfo'
import styles from './styles.css'

import type { Dispatch } from '../../types'
import type { Robot } from '../../discovery'

type Props = {| robot: Robot |}

const { PIPETTE_MOUNTS } = robotConstants

const inexactPipetteSupportArticle =
  'https://support.opentrons.com/en/articles/3450143-gen2-pipette-compatibility'
const TITLE = 'Required Pipettes'

function ProtocolPipettes(props: Props) {
  const dispatch: Dispatch = useDispatch()
  const infoByMount = useInstrumentMountInfo(props.robot.name)
  React.useEffect(() => {
    dispatch(fetchPipettes(props.robot))
  }, [dispatch, props.robot])

  const changePipetteUrl = `/robots/${props.robot.name}/instruments`

  const allPipettesMatch = every(infoByMount, ({ compatibility }) =>
    ['match', 'inexact_match'].includes(compatibility)
  )

  const someInexactMatches = some(
    infoByMount,
    ({ compatibility }) => compatibility === 'inexact_match'
  )

  return (
    <InfoSection title={TITLE}>
      <SectionContentHalf>
        {PIPETTE_MOUNTS.map(mount => {
          const info = infoByMount[mount]
          if (!info) return null
          const { protocol, compatibility } = info
          return (
            <InstrumentItem
              key={protocol.mount}
              compatibility={compatibility}
              mount={protocol.mount}
              hidden={!protocol.name}
            >
              {protocol.displayName}
            </InstrumentItem>
          )
        }).filter(Boolean)}
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

export default ProtocolPipettes
