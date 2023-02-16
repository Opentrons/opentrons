import * as React from 'react'
import isEqual from 'lodash/isEqual'
import {
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'
import { JogControls } from '../../molecules/JogControls'

import type { CreateCommand } from '@opentrons/shared-data'
import type { Axis, Sign, StepSize } from '../../molecules/JogControls/types'
import { useAttachedPipettes } from '../Devices/hooks'
import { useCreateRunCommandMutation } from '../../resources/runs/hooks'
import { useCreateRunMutation, useStopRunMutation } from '@opentrons/react-api-client'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { useToggleGroup } from '../../molecules/ToggleGroup/useToggleGroup'
import { AttachedPipettesByMount, Mount } from '@opentrons/api-client'

interface JogGantryProps {
  handleClose: () => void
}
export const JogGantry = (props: JogGantryProps): JSX.Element | null => {
  const { handleClose } = props
  const [runId, setRunId] = React.useState<string | null>(null)
  const attachedPipettes = useAttachedPipettes()
  const { createRun } = useCreateRunMutation(
    { onSuccess: response => { setRunId(response.data.id) } },
  )
  React.useEffect(() => { createRun({}) }, [])

  const { stopRun } = useStopRunMutation({
    onSuccess: () => {
      setRunId(null)
      handleClose()
    }
  })

  return (
    <ModalShell
      width="47rem"
      height="auto"
      header={
        <WizardHeader
          title="Jog Gantry"
          onExit={() => runId != null && stopRun(runId)}
        />
      }
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        padding={SPACING.spacing6}
        minHeight="25rem"
      >
        {runId != null ? <GantryControlsComponent runId={runId} attachedPipettes={attachedPipettes} /> : null}
      </Flex>
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

  let loadCommands: CreateCommand[] = []
  if (attachedPipettes.left != null) {
    loadCommands = [...loadCommands, {
      commandType: 'loadPipette',
      params: {
        pipetteId: attachedPipettes.left.id,
        mount: 'left'
      }
    }]
  }
  if (attachedPipettes.right != null) {
    loadCommands = [...loadCommands, {
      commandType: 'loadPipette',
      params: {
        pipetteId: attachedPipettes.right.id,
        mount: 'right'
      }
    }]
  }
  console.log('loadCommands', loadCommands)
  // React.useEffect(() => {
  //   loadCommands.forEach(c => {
  //     createRunCommand({ command: c })
  //       .then(() => { })
  //       .catch(e => {
  //         console.error(`error issuing load pipette command: ${e.message}`)
  //       })
  //   })
  // }, [loadCommands, createRunCommand])
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
        }
      })
        .then(() => { })
        .catch((e: Error) => {
          console.error(`error issuing jog command: ${e.message}`)
        })
    }
  }
  return (
    <>
      {toggleGroup}
      <JogControls
        jog={(axis, direction, step, _onSuccess) =>
          handleJog(axis, direction, step)
        }
      />
    </>
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

