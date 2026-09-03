import { LabwareRender, RobotWorkSpace } from '@opentrons/components'

import type { ComponentProps, ReactNode } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

// todo(mm, 2025-05-16):
// LabwareRender accepts LabwareDefinition2 | LabwareDefinition3.
// We're not ready to deal with LabwareDefinition3 here yet because we haven't figured
// out how to port the viewbox calculation. This should be just
// ComponentProps<typeof LabwareRender> once we do.
type Props = Omit<ComponentProps<typeof LabwareRender>, 'definition'> & {
  definition: LabwareDefinition2
}

/** Avoid boilerplate for viewbox-based-on-labware-dimensions */
export function SingleLabware(props: Props): ReactNode {
  return (
    <RobotWorkSpace
      viewBox={`0 0 ${props.definition.dimensions.xDimension} ${props.definition.dimensions.yDimension}`}
    >
      {() => <LabwareRender {...props} />}
    </RobotWorkSpace>
  )
}
