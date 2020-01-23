// @flow
import * as React from 'react'
import { Icon } from '@opentrons/components'
import KnowledgeBaseLink from '../KnowledgeBaseLink'
import styles from './styles.css'

import type { FormModulesByType } from '../../step-forms'

type Props = {
  modules?: FormModulesByType,
}

export function CrashInfoBox(props: Props) {
  return (
    <div className={styles.crash_info_container}>
      <div className={styles.crash_info_box}>
        <div className={styles.crash_info_title}>
          <Icon name="alert-circle" className={styles.alert_icon} />
          <strong>Limited access to slots</strong>
        </div>
        <p>
          <strong>GEN1 8-Channel</strong> pipettes cannot access slots behind{' '}
          {''}
          <strong>GEN1 Temperature or Magnetic modules.</strong>
        </p>
        <KnowledgeBaseLink to="pipetteGen1MultiModuleCollision">
          Read more here
        </KnowledgeBaseLink>
      </div>
      {props.modules && (
        <img
          className={styles.crash_info_diagram}
          src={getCrashDiagramSrc(props.modules)}
        />
      )}
    </div>
  )
}

function getCrashDiagramSrc(modules: FormModulesByType) {
  let CRASH_DIAGRAM_SRC = null
  if (modules.magdeck.onDeck && modules.tempdeck.onDeck) {
    return require('../../images/modules/crash_warning_mag_temp.png')
  } else if (modules.magdeck.onDeck) {
    return require('../../images/modules/crash_warning_mag.png')
  } else if (modules.tempdeck.onDeck) {
    return require('../../images/modules/crash_warning_temp.png')
  }
  return CRASH_DIAGRAM_SRC
}
