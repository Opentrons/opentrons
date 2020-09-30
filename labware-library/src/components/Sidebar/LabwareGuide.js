// @flow
// labware filters
import * as React from 'react'

import { getPublicPath } from '../../public-path'

import { Icon } from '@opentrons/components'
import { Link } from 'react-router-dom'
import styles from './styles.css'

import {
  LABWARE_GUIDE,
  WHAT_IS_A_LABWARE_DEFINITION,
  USING_THE_LABWARE_LIBRARY,
  CREATING_CUSTOM_LABWARE_DEFINITIONS,
  LABWARE_CREATOR,
} from '../../localization'

const LINKS = [
  {
    label: WHAT_IS_A_LABWARE_DEFINITION,
    href:
      'https://support.opentrons.com/en/articles/3136501-what-is-a-labware-definition',
  },
  {
    label: USING_THE_LABWARE_LIBRARY,
    href:
      'https://support.opentrons.com/en/articles/3136507-using-the-labware-library',
  },
  {
    label: CREATING_CUSTOM_LABWARE_DEFINITIONS,
    href:
      'https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions',
  },
]

export function LabwareGuide(): React.Node {
  return (
    <section className={styles.labware_guide}>
      <div className={styles.labware_guide_container}>
        <h2 className={styles.labware_guide_title}>
          <Icon
            className={styles.labware_guide_icon}
            name="book-open-page-variant"
          />
          {LABWARE_GUIDE}
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
          <li>
            <Link
              to={`${getPublicPath()}create`}
              className={styles.labware_guide_link}
            >
              {LABWARE_CREATOR}
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}
