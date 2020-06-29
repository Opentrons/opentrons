// @flow
import { Icon } from '@opentrons/components'
import * as React from 'react'

import { KnowledgeBaseLink } from '../KnowledgeBaseLink'
import styles from './styles.css'

type Props = {|
  showDiagram?: boolean,
  magnetOnDeck: ?boolean,
  temperatureOnDeck: ?boolean,
|}

export function CrashInfoBox(props: Props): React.Node {
  const moduleMessage = getCrashableModulesCopy(props) || ''
  return (
    <div className={styles.crash_info_container}>
      <div className={styles.crash_info_box}>
        <div className={styles.crash_info_title}>
          <Icon name="information" className={styles.alert_icon} />
          <strong>Limited access to slots</strong>
        </div>
        <p>
          <strong>GEN1 8-Channel</strong> pipettes cannot access slots behind{' '}
          <strong>GEN1 {moduleMessage} modules.</strong>
        </p>
        <KnowledgeBaseLink to="pipetteGen1MultiModuleCollision">
          Read more here
        </KnowledgeBaseLink>
      </div>
      {props.showDiagram && (
        <img
          className={styles.crash_info_diagram}
          src={getCrashDiagramSrc(props)}
        />
      )}
    </div>
  )
}

function getCrashableModulesCopy(props: Props): string | null {
  const { magnetOnDeck, temperatureOnDeck } = props
  if (magnetOnDeck && temperatureOnDeck) {
    return 'Temperature or Magnetic'
  } else if (magnetOnDeck) {
    return 'Magnetic'
  } else if (temperatureOnDeck) {
    return 'Temperature'
  }
  return null
}
function getCrashDiagramSrc(props: Props): string | null {
  const { magnetOnDeck, temperatureOnDeck } = props
  const CRASH_DIAGRAM_SRC: string | null = null
  if (magnetOnDeck && temperatureOnDeck) {
    return require('../../images/modules/crash_warning_mag_temp.png')
  } else if (magnetOnDeck) {
    return require('../../images/modules/crash_warning_mag.png')
  } else if (temperatureOnDeck) {
    return require('../../images/modules/crash_warning_temp.png')
  }
  return CRASH_DIAGRAM_SRC
}
