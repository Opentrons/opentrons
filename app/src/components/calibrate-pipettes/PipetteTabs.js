// @flow
// instrument tabs bar container
// used for left/right pipette selection during pipette calibration
import * as React from 'react'
import { useSelector } from 'react-redux'

import { getCalibratePipettesLocations } from '../../nav'
import { PIPETTE_MOUNTS } from '../../pipettes'
import { PageTabs } from '@opentrons/components'

export type PipetteTabsProps = {|
  currentMount: ?string,
|}

export function PipetteTabs(props: PipetteTabsProps) {
  const { currentMount } = props
  const pagesByMount = useSelector(getCalibratePipettesLocations)

  const pages = PIPETTE_MOUNTS.map(mount => ({
    title: mount,
    href: pagesByMount[mount].path,
    isActive: mount === currentMount,
    isDisabled: pagesByMount[mount].disabledReason !== null,
  }))

  return <PageTabs pages={pages} />
}
