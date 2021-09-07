// instrument tabs bar container
// used for left/right pipette selection during pipette calibration
import * as React from 'react'
import { useSelector } from 'react-redux'

import { getCalibratePipettesLocations } from '../../../redux/nav'
import { PIPETTE_MOUNTS } from '../../../redux/pipettes'
import { PageTabs } from '@opentrons/components'

export interface PipetteTabsProps {
  currentMount: string | null | undefined
}

export function PipetteTabs(props: PipetteTabsProps): JSX.Element {
  const { currentMount } = props
  const pagesByMount = useSelector(getCalibratePipettesLocations)

  const pages = PIPETTE_MOUNTS.map(mount => ({
    title: mount,
    href: pagesByMount[mount].default.path,
    isActive: mount === currentMount,
    isDisabled: pagesByMount[mount].disabledReason !== null,
  }))

  return <PageTabs pages={pages} />
}
