// @flow
import * as React from 'react'
import LinkOut from './LinkOut'
import { LINK_CUSTOM_LABWARE_FORM } from '../fields'
import styles from '../styles.css'

const IntroCopy = () => (
  <>
    <p>Use this tool if you are creating one of the following:</p>
    <ul>
      <li>
        Well plates and reservoirs which can be made via the labware creator
        (refer to{' '}
        <LinkOut href="https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions">
          this guide
        </LinkOut>{' '}
        for more information)
      </li>
      <li>
        Tubes + the{' '}
        <LinkOut href="https://shop.opentrons.com/collections/racks-and-adapters/products/tube-rack-set-1">
          Opentrons tube rack
        </LinkOut>
      </li>
      <li>
        Tubes / plates + the{' '}
        <LinkOut href="https://shop.opentrons.com/collections/racks-and-adapters/products/aluminum-block-set">
          Opentrons aluminum block
        </LinkOut>
      </li>
    </ul>
    <p>
      For all other custom labware, please use this{' '}
      <LinkOut href={LINK_CUSTOM_LABWARE_FORM}>request form</LinkOut>
    </p>

    <div className={styles.callout}>
      <p>
        <strong>Please note:</strong> We strongly recommend you reference
        mechanical drawings to ensure accurate measurements for defining
        labware, only relying on manual measurements to supplement missing
        information. To learn more about ways to access mechanical drawings from
        manufacturers, please refer to this guide.
      </p>
    </div>
  </>
)

export default IntroCopy
