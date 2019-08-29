// @flow
import * as React from 'react'
import { PrimaryButton } from '@opentrons/components'
import LinkOut from './LinkOut'
import { LINK_CUSTOM_LABWARE_FORM } from '../fields'
import styles from '../styles.css'

const IntroCopy = () => (
  <>
    <PrimaryButton
      Component="LinkOut"
      href="https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions"
      className={styles.labware_guide_button}
    >
      read the custom labware guide
    </PrimaryButton>
    <p>
      The BETA version of this tool will allow you to create definitions for
      well plates, reservoirs, tubes in Opentrons tube racks, and plates/tubes
      in Opentrons aluminum blocks.
    </p>
    <p>
      The basic restrictions on the type of labware this tool can create are
      listed below. For more details read the{' '}
      <LinkOut href="https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions">
        custom labware guide
      </LinkOut>
      .
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
      <LinkOut href={LINK_CUSTOM_LABWARE_FORM}>request form</LinkOut>
    </p>

    <p>
      Upon completing the form you’ll be able to export the labware definition
      for use on the OT-2. The zipped file you download will contain 1) the
      labware definition as a JSON file, and 2) a python protocol referencing
      the labware to help you test and troubleshoot the accuracy of the
      definition on your robot.
    </p>

    <p>
      It’s important to create a labware definition that is precise, and does
      not rely on excessive calibration prior to each run to achieve accuracy.
      In this way you’ll generate labware definitions that are reusable and
      shareable with others inside or outside your lab.
    </p>

    <div className={styles.callout}>
      <p>
        <strong>Please note:</strong> We strongly recommend you reference
        mechanical drawings directly from your supplier or manufacturer and only
        rely on manual measurements to supplement missing information. Refer to
        the bottom of{' '}
        <LinkOut href="https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions">
          this guide
        </LinkOut>{' '}
        for some tips on how to get the most accuracy with your manual
        measurements.
      </p>
    </div>
  </>
)

export default IntroCopy
