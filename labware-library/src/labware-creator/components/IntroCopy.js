// @flow
import * as React from 'react'
import { Link } from 'react-router-dom'
import { getPublicPath } from '../../public-path'
import { LINK_CUSTOM_LABWARE_FORM } from '../fields'
import styles from '../styles.css'
import { LinkOut } from './LinkOut'

const LINK_CUSTOM_LABWARE_GUIDE =
  'https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions'

const LINK_LABWARE_LIBRARY = getPublicPath()

export const IntroCopy = (): React.Node => (
  <>
    <LinkOut
      href={LINK_CUSTOM_LABWARE_GUIDE}
      className={styles.labware_guide_button}
    >
      read the custom labware guide
    </LinkOut>
    <p>
      This tool will allow you to create definitions for well plates,
      reservoirs, tubes in Opentrons tube racks, and plates/tubes in Opentrons
      aluminum blocks that do not already exist on the{' '}
      <Link to={LINK_LABWARE_LIBRARY} className={styles.link}>
        Labware Library
      </Link>
      .
    </p>
    <p>
      Use this tool only if your labware meets the following{' '}
      <strong>requirements:</strong>
    </p>
    <ol>
      <li>All your wells/tubes must be the same size and volume.</li>
      <li>All columns and rows must be evenly spaced.</li>
      <li>
        The labware must fit snugly into a slot on the deck without the help of
        an adapter.
      </li>
    </ol>
    <p>
      For all other custom labware, please use this{' '}
      <LinkOut href={LINK_CUSTOM_LABWARE_FORM} className={styles.link}>
        request form
      </LinkOut>
      .
    </p>

    <div className={styles.callout}>
      <p>
        <strong>Please note:</strong> We strongly recommend you reference
        mechanical drawings directly from your supplier/manufacturer and only
        rely on manual measurements (using calipers when possible) to supplement
        missing information. Refer to the bottom of{' '}
        <LinkOut href={LINK_CUSTOM_LABWARE_GUIDE} className={styles.link}>
          this guide
        </LinkOut>{' '}
        for some tips on how to get the most accuracy with your manual
        measurements.
      </p>
    </div>
  </>
)
