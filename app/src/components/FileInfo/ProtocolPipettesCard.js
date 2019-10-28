// @flow
// setup pipettes component
import * as React from 'react'
import { useDispatch } from 'react-redux'
import every from 'lodash/every'
import map from 'lodash/map'
import some from 'lodash/some'

import { InstrumentGroup, Icon } from '@opentrons/components'
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

const inexactPipetteSupportArticle = 'https://support.opentrons.com/ot-2'
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

  console.log(infoByMount)
  return (
    <InfoSection title={TITLE}>
      <SectionContentHalf>
        {map(infoByMount, ({ protocol, compatibility }) => (
          <InstrumentItem
            key={protocol.mount}
            compatibility={compatibility}
            mount={protocol.mount}
            hidden={!protocol.name}
          >
            {protocol.displayName}
          </InstrumentItem>
        ))}
      </SectionContentHalf>
      {!allPipettesMatch && (
        <MissingItemWarning instrumentType="pipette" url={changePipetteUrl} />
      )}
      {allPipettesMatch && someInexactMatches && (
        <SectionContentHalf className={styles.soft_warning}>
          <div className={styles.warning_info_wrapper}>
            <Icon name="information" className={styles.info_icon} />
            <span>Inexact pipette match</span>
            <a
              href={inexactPipetteSupportArticle}
              target="_blank"
              rel="noopener noreferrer"
            >
              &nbsp; learn more
            </a>
          </div>
        </SectionContentHalf>
      )}
    </InfoSection>
  )
}

export default ProtocolPipettes
