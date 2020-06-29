// @flow

import { LabeledButton } from '@opentrons/components'
import * as React from 'react'

// TODO(mc, 2019-11-18): i18n
const ADD_NEW_LABWARE_DEFINITIONS = 'Add New Labware Definitions'
const ADD_LABWARE = 'Add Labware'
const ADD_LABWARE_DESCRIPTION =
  'Add labware definitions to your Custom Labware Definitions folder for use on any OT-2 robot.'
const CUSTOM_LABWARE_CREATOR = 'Custom Labware Creator'
const USE_THE = 'Use the'
const TO_GENERATE_NEW_LABWARE_DEFINITIONS =
  'to generate new labware definitions'

const LABWARE_CREATOR_HREF = 'https://labware.opentrons.com/create'

export const ADD_LABWARE_NAME = 'add-labware'

export type AddLabwareProps = {|
  onAddLabware: () => mixed,
|}

export function AddLabware(props: AddLabwareProps): React.Node {
  const { onAddLabware } = props

  return (
    <LabeledButton
      label={ADD_NEW_LABWARE_DEFINITIONS}
      buttonProps={{
        name: ADD_LABWARE_NAME,
        children: ADD_LABWARE,
        onClick: onAddLabware,
      }}
    >
      <p>{ADD_LABWARE_DESCRIPTION}</p>
      <p>
        {USE_THE}{' '}
        <a
          href={LABWARE_CREATOR_HREF}
          target="_blank"
          rel="noopener noreferrer"
        >
          {CUSTOM_LABWARE_CREATOR}
        </a>{' '}
        {TO_GENERATE_NEW_LABWARE_DEFINITIONS}
      </p>
    </LabeledButton>
  )
}
