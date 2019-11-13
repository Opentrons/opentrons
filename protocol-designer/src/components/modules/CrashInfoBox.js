// @flow
import * as React from 'react'
import { Icon } from '@opentrons/components'
import KnowledgeBaseLink from '../KnowledgeBaseLink'
import styles from './styles.css'

const CRASH_DIAGRAM_SRC = require('../../images/modules/crash_warning_illustration.png')

export default function CrashInfoBox() {
  return (
    <div className={styles.crash_info_container}>
      <img src={CRASH_DIAGRAM_SRC} className={styles.crash_info_diagram} />
      <div className={styles.crash_info_box}>
        <div>
          <Icon name="alert-circle" className={styles.alert_icon} />
          <strong>Crash warning!</strong>
        </div>
        <p>
          8-Channel GEN1 pipettes cannot access slots adjacent to Temperature or
          Magnetic modules.
        </p>
        <KnowledgeBaseLink to="pipetteGen1MultiModuleCollision">
          Read more here
        </KnowledgeBaseLink>
      </div>
    </div>
  )
}
