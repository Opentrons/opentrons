// @flow
// setup pipettes component
import * as React from 'react'
import { useDispatch } from 'react-redux'
import every from 'lodash/every'
import some from 'lodash/some'

import { Icon } from '@opentrons/components'
import { constants as robotConstants } from '../../robot'
import { fetchPipettes } from '../../pipettes'
import InstrumentItem from './InstrumentItem'
import { SectionContentHalf } from '../layout'
import InfoSection from './InfoSection'
import MissingItemWarning from './MissingItemWarning'
import useInstrumentMountInfo, {
  MATCH,
  INEXACT_MATCH,
} from './useInstrumentMountInfo'

import styles from './styles.css'

import type { Dispatch } from '../../types'

type Props = {| robotName: string |}

const { PIPETTE_MOUNTS } = robotConstants

const inexactPipetteSupportArticle =
  'https://support.opentrons.com/en/articles/3450143-gen2-pipette-compatibility'
const TITLE = 'Required Pipettes'

function ProtocolPipettes(props: Props) {
  const { robotName } = props
  const dispatch = useDispatch<Dispatch>()
  const infoByMount = useInstrumentMountInfo(robotName)

  React.useEffect(() => {
    dispatch(fetchPipettes(robotName))
  }, [dispatch, robotName])

  const changePipetteUrl = `/robots/${robotName}/instruments`

  const allPipettesMatch = every(infoByMount, ({ compatibility }) =>
    [MATCH, INEXACT_MATCH].includes(compatibility)
  )

  const someInexactMatches = some(
    infoByMount,
    ({ compatibility }) => compatibility === INEXACT_MATCH
  )

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

export default ProtocolPipettes
