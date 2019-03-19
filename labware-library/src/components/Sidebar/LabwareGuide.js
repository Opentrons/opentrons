// @flow
// labware filters
import * as React from 'react'

import {Icon} from '@opentrons/components'
import styles from './styles.css'

// TODO(mc, 2019-03-14): i18n
const EN_LABWARE_GUIDE = 'Labware Guide'
const EN_HOW_TO_CHOOSE_LABWARE = 'How to choose labware'
const EN_MAKING_CUSTOM_DEFINITIONS = 'Making custom definitions'

const LINKS = [
  {label: EN_HOW_TO_CHOOSE_LABWARE, href: '#'},
  {label: EN_MAKING_CUSTOM_DEFINITIONS, href: '#'},
]

export default function LabwareGuide () {
  return (
    <section className={styles.labware_guide}>
      <div className={styles.labware_guide_container}>
        <h2 className={styles.labware_guide_title}>
          <Icon
            className={styles.labware_guide_icon}
            name="book-open-page-variant"
          />
          {EN_LABWARE_GUIDE}
        </h2>
        <ul className={styles.labware_guide_list}>
          {LINKS.map((a, i) => (
            <li key={i}>
              <a
                className={styles.labware_guide_link}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {a.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
