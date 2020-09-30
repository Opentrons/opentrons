// @flow
import * as React from 'react'
import styles from './MagneticModuleWarningModalContent.css'
import { KnowledgeBaseLink } from '../../KnowledgeBaseLink'

export const MagneticModuleWarningModalContent = (): React.Node => (
  <div className={styles.content}>
    <p>
      Switching between GEN1 and GEN2 Magnetic Modules{' '}
      <strong>will clear all non-default engage heights</strong> from existing
      magnet steps because they do not use the same units.
    </p>

    <ul className={styles.bullet_list}>
      <li>
        <div>Converting engage height from GEN1 to GEN2</div>
        <ul>
          <li>Divide your engage height by 2</li>
        </ul>
      </li>
      <li>
        <div>Converting engage height from GEN2 to GEN1</div>
        <ul>
          <li>Multiply your engage height by 2</li>
        </ul>
      </li>
    </ul>

    <p>
      You may also need to <strong>alter the time you pause</strong> while your
      magnet is engaged.
    </p>
    <p>
      Read more about the difference between GEN1 and GEN2 magnetic modules{' '}
      <KnowledgeBaseLink to="magneticModuleGenerations">here</KnowledgeBaseLink>
    </p>
  </div>
)
