import * as React from 'react'
import isEqual from 'lodash/isEqual'
import {
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  SPACING,
  SIZE_4,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
} from '@opentrons/components'
import { JogControls } from '../../molecules/JogControls'

import type { CreateCommand } from '@opentrons/shared-data'
import type { Axis, Sign, StepSize } from '../../molecules/JogControls/types'
import { useAttachedPipettes } from '../Devices/hooks'
import { useCreateRunCommandMutation } from '../../resources/runs/hooks'
import { useCreateRunMutation, useDeleteRunMutation, useStopRunMutation } from '@opentrons/react-api-client'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { useToggleGroup } from '../../molecules/ToggleGroup/useToggleGroup'
import { AttachedPipettesByMount, Mount, VectorOffset } from '@opentrons/api-client'
import { LiveOffsetValue } from '../LabwarePositionCheck/LiveOffsetValue'

interface JogGantryProps {
  handleClose: () => void
}
export const JogGantry = (props: JogGantryProps): JSX.Element | null => {
  const { handleClose } = props
  const [runId, setRunId] = React.useState<string | null>(null)
  const [isExiting, setIsExiting] = React.useState<boolean>(false)
  const attachedPipettes = useAttachedPipettes()
  const { createRun } = useCreateRunMutation(
    { onSuccess: response => { setRunId(response.data.id) } },
  )
  React.useEffect(() => { createRun({}) }, [])
  const { deleteRun } = useDeleteRunMutation({
    onSuccess: () => { handleClose() }
  })
  const { stopRun } = useStopRunMutation({
    onSuccess: () => {
      runId != null && deleteRun(runId)
      setRunId(null)
    }
  })

  const handleExit = (): void => {
    setIsExiting(true)
    runId != null ? stopRun(runId) : handleClose()
  }

  return (
    <ModalShell
      width="100vw"
      height="100vh"
      header={
        <WizardHeader
          title="Jog Gantry"
          onExit={isExiting ? undefined : handleExit}
        />
      }
    >
      {isExiting ? (
        <Flex height="100%" width="100%" justifyContent={JUSTIFY_CENTER} alignItems={ALIGN_CENTER} >
          <Icon name="ot-spinner" spin size={SIZE_4} />
        </Flex>
      ) : (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={SPACING.spacing6}
          minHeight="25rem"
        >
          {runId != null ? <GantryControlsComponent runId={runId} attachedPipettes={attachedPipettes} /> : null}
        </Flex>
      )}
    </ModalShell>
  )
}

interface GantryControlsProps {
  runId: string,
  attachedPipettes: AttachedPipettesByMount
}
function GantryControlsInner(props: GantryControlsProps): JSX.Element {
  const { runId, attachedPipettes } = props
  const { createRunCommand } = useCreateRunCommandMutation(runId)
  const [lastKnownPosition, setLastKnownPosition] = React.useState<VectorOffset>({ x: 0, y: 0, z: 0 })

  let loadCommands: CreateCommand[] = []
  if (attachedPipettes.left != null) {
    loadCommands = [...loadCommands, {
      commandType: 'loadPipette',
      params: {
        pipetteName: attachedPipettes.left.name,
        pipetteId: attachedPipettes.left.id,
        mount: 'left'
      }
    }]
  }
  if (attachedPipettes.right != null) {
    loadCommands = [...loadCommands, {
      commandType: 'loadPipette',
      params: {
        pipetteName: attachedPipettes.right.name,
        pipetteId: attachedPipettes.right.id,
        mount: 'right'
      }
    }]
  }
  React.useEffect(() => {
    loadCommands.forEach(c => {
      createRunCommand({ command: c })
        .then(() => { })
        .catch(e => {
          console.error(`error issuing load pipette command: ${e.message}`)
        })
    })
  }, [])
  const [selectedMount, toggleGroup] = useToggleGroup('left', 'right')

  const handleJog = (
    axis: Axis,
    dir: Sign,
    step: StepSize,
  ): void => {
    const pipetteId = attachedPipettes[selectedMount as Mount]?.id
    if (pipetteId != null) {
      createRunCommand({
        command: {
          commandType: 'moveRelative',
          params: { pipetteId, distance: step * dir, axis },
        },
        waitUntilComplete: true
      })
        .then(({data}) => { 
          console.log('result', data)
          setLastKnownPosition(data.result?.position)
        })
        .catch((e: Error) => {
          console.error(`error issuing jog command: ${e.message}`)
        })
    }
  }
  return (
    <Flex>
      <Flex flex="1" flexDirection={DIRECTION_COLUMN}>
        {toggleGroup}
        <LiveOffsetValue {...lastKnownPosition} />
      </Flex>

      <Flex flex="4">
        <JogControls
          jog={(axis, direction, step, _onSuccess) =>
            handleJog(axis, direction, step)
          }
        />
      </Flex>
    </Flex>
  )
}

export const GantryControlsComponent = React.memo(
  GantryControlsInner,
  ({
    runId: prevRunId,
    attachedPipettes: prevAttachedPipettes
  }, {
    runId: nextRunId,
    attachedPipettes: nextAttachedPipettes
  }) => prevRunId === nextRunId && isEqual(prevAttachedPipettes, nextAttachedPipettes)
)

