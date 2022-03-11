import * as React from 'react'
import { AlertItem } from '@opentrons/components'
import { NEW_LABWARE_MESSAGE } from '../../localization'

export function NewLabwareAlert(): JSX.Element {
  return <AlertItem type="info" title={NEW_LABWARE_MESSAGE} />
}
