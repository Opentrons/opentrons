import { parseInitialPipetteNamesByMount } from '@opentrons/shared-data'
import { getFullStackFromLabwares } from '@opentrons/step-generation'

import { LabwareSlotContainer } from '../LabwareSlotContainer'
import { PipetteContainer } from '../PipetteContainer'
import { TipDisposalContainer } from '../TipDisposalContainer'
import { TipPickupContainer } from '../TipPickupContainer'
import { getActiveSlotForLabwareDetails } from '../utils/getActiveSlotForLabwareDetails'
import { getActiveSlotForTiprackDetails } from '../utils/getActiveSlotForTiprackDetails'
import { getIsPipetteActive } from '../utils/getIsPipetteActive'
import styles from './stepdetailcontainer.module.css'

import type { Liquid, RunTimeCommand } from '@opentrons/shared-data'
import type { InvariantContext, RobotState } from '@opentrons/step-generation'

interface StepDetailContainerProps {
  commands: RunTimeCommand[]
  robotState: RobotState
  invariantContext: InvariantContext
  liquids: Liquid[]
  currentCommand: RunTimeCommand
}

export function StepDetailContainer({
  commands,
  robotState,
  invariantContext,
  currentCommand,
  liquids,
}: StepDetailContainerProps): JSX.Element {
  const { labwareEntities, pipetteEntities, moduleEntities } = invariantContext
  const { labware, pipettes } = robotState
  const tiprackActiveSlot = getActiveSlotForTiprackDetails(
    Object.values(pipettes),
    robotState,
    invariantContext
  )
  const tiprackStack =
    tiprackActiveSlot != null
      ? getFullStackFromLabwares(labware, tiprackActiveSlot)
      : []
  const labwareActiveSlot = getActiveSlotForLabwareDetails(
    robotState,
    invariantContext,
    currentCommand
  )
  const stackOfLabwareOnSlot =
    labwareActiveSlot != null
      ? getFullStackFromLabwares(labware, labwareActiveSlot)
      : []
  const topMostLabwareOnSlot =
    stackOfLabwareOnSlot?.length > 1 ? stackOfLabwareOnSlot[0] : null
  const tiprackOnSlot = tiprackStack.length > 1 ? tiprackStack[0] : null

  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    commands.length > 0
      ? parseInitialPipetteNamesByMount(commands)
      : { left: null, right: null }
  const is96Channel =
    leftMountPipetteName != null &&
    rightMountPipetteName == null &&
    (leftMountPipetteName === 'p1000_96' || leftMountPipetteName === 'p200_96')

  const isLeftPipetteActive = getIsPipetteActive(
    'left',
    pipettes,
    currentCommand
  )
  const isRightPipetteActive = getIsPipetteActive(
    'right',
    pipettes,
    currentCommand
  )

  type ComponentType =
    | 'left_pipette'
    | 'right_pipette'
    | 'tiprack'
    | 'labware'
    | 'disposal'

  const getComponentsToRender = (): ComponentType[] => {
    const components: ComponentType[] = []

    if (leftMountPipetteName != null || is96Channel) {
      components.push('left_pipette')
    }
    if (rightMountPipetteName != null) {
      components.push('right_pipette')
    }
    if (tiprackOnSlot != null && labwareEntities[tiprackOnSlot] != null) {
      components.push('tiprack')
    }
    if (topMostLabwareOnSlot != null) {
      components.push('labware')
    }
    // temporary filtering out the disposal card for RS 9.0.0
    // components.push('disposal')

    return components
  }

  const renderComponent = (type: ComponentType, index: number): JSX.Element => {
    const className = styles[`${type}_container`] ?? styles.container

    switch (type) {
      case 'left_pipette':
        return (
          <div key={`left-pipette-${index}`} className={className}>
            <PipetteContainer
              mount={is96Channel ? 'left_right_mount' : 'left_mount'}
              pipetteName={leftMountPipetteName!}
              selected={isLeftPipetteActive}
            />
          </div>
        )
      case 'right_pipette':
        return (
          <div key={`right-pipette-${index}`} className={className}>
            <PipetteContainer
              mount="right_mount"
              pipetteName={rightMountPipetteName!}
              selected={isRightPipetteActive}
            />
          </div>
        )
      case 'tiprack':
        return (
          <div key={`tiprack-${index}`} className={className}>
            <TipPickupContainer
              tiprackEntity={labwareEntities[tiprackOnSlot!]}
              robotState={robotState}
            />
          </div>
        )
      case 'labware':
        return (
          <div key={`labware-${index}`} className={className}>
            <LabwareSlotContainer
              topLabwareOnSlotId={topMostLabwareOnSlot!}
              labwareEntities={labwareEntities}
              commands={commands}
              currentCommand={currentCommand}
              liquids={liquids}
              robotState={robotState}
              pipetteEntities={pipetteEntities}
              moduleEntities={moduleEntities}
            />
          </div>
        )
      case 'disposal':
        return (
          <div key={`disposal-${index}`} className={className}>
            <TipDisposalContainer robotState={robotState} />
          </div>
        )
    }
  }

  return (
    <div className={styles.container}>
      {getComponentsToRender().map((type, index) =>
        renderComponent(type, index)
      )}
    </div>
  )
}
