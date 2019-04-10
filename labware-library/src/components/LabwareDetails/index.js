// @flow
// full-width labware details
import * as React from 'react'

import type { LabwareDefinition } from '../../types'

export type LabwareDetailsProps = {
  definition: LabwareDefinition,
}

export default function LabwareDetails(props: LabwareDetailsProps) {
  return <p>hello labware {props.definition.metadata.displayName}</p>
}
