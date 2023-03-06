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
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  SIZE_1,
  Box
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
import { AttachedPipettesByMount, Mount, RUN_STATUS_STOPPED, VectorOffset } from '@opentrons/api-client'
import { LiveOffsetValue } from '../LabwarePositionCheck/LiveOffsetValue'
import { useRunStatus } from '../RunTimeControl/hooks'
import { RobotModel } from '../../redux/discovery/types'
import { DeckView } from './DeckView'
import { StyledText } from '../../atoms/text'

interface ManualControlPanelProps {
  handleClose: () => void
  robotModel: RobotModel
}
export const ManualControlPanel = (props: ManualControlPanelProps): JSX.Element | null => {
  const { handleClose, robotModel } = props
  const [runId, setRunId] = React.useState<string | null>(null)
  const [isExiting, setIsExiting] = React.useState<boolean>(false)
  const attachedPipettes = useAttachedPipettes()
  const { createRun } = useCreateRunMutation(
    { onSuccess: response => { setRunId(response.data.id) } },
  )
  React.useEffect(() => { createRun({}) }, [])

  const runStatus = useRunStatus(runId)
  React.useEffect(() => {
    if (runId != null && runStatus === RUN_STATUS_STOPPED) deleteRun(runId)
  }, [runStatus])

  const { deleteRun } = useDeleteRunMutation({
    onSuccess: () => { handleClose() }
  })
  const { stopRun } = useStopRunMutation()

  const handleExit = (): void => {
    setIsExiting(true)
    runId != null ? stopRun(runId) : handleClose()
  }

  const [lastKnownPosition, setLastKnownPosition] = React.useState<VectorOffset>({ x: 0, y: 0, z: 0 })

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
          {runId != null ? (
            <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
              <Box flex="2">
                <GantryControlsComponent {...{ runId, attachedPipettes, lastKnownPosition, setLastKnownPosition }} />
              </Box>
              <Flex flex="3" flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
                <DeckView {...{robotModel, lastKnownPosition, setLastKnownPosition}} />
                <CurrentCoords lastKnownPosition={lastKnownPosition} />
              </Flex>
            </Flex>
          ) : null}
        </Flex>
      )}
    </ModalShell>
  )
}

interface GantryControlsProps {
  runId: string,
  attachedPipettes: AttachedPipettesByMount
  setLastKnownPosition: (position: VectorOffset) => void
}
function GantryControlsInner(props: GantryControlsProps): JSX.Element {
  const { runId, attachedPipettes, setLastKnownPosition } = props
  const { createRunCommand } = useCreateRunCommandMutation(runId)

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
        .then(({ data }) => {
          setLastKnownPosition(data.result?.position)
        })
        .catch((e: Error) => {
          console.error(`error issuing jog command: ${e.message}`)
        })
    }
  }
  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {toggleGroup}
      <JogControls
        flexWrap='wrap'
        jog={(axis, direction, step, _onSuccess) =>
          handleJog(axis, direction, step)
        }
      />
    </Flex>
  )
}

interface CurrentCoordsProps { lastKnownPosition: VectorOffset }
function CurrentCoords(props: CurrentCoordsProps): JSX.Element {
  const { lastKnownPosition } = props
  return (
    <Flex
      flex="0 1 auto"
      alignItems={ALIGN_CENTER}
      border={`${BORDERS.styleSolid} ${SPACING.spacingXXS} ${COLORS.lightGreyHover}`}
      borderRadius={BORDERS.radiusSoftCorners}
      padding={SPACING.spacing3}
    >
      <Icon name="reticle" size={SIZE_1} />
      {[lastKnownPosition.x, lastKnownPosition.y, lastKnownPosition.z].map((axis, index) => (
        <React.Fragment key={index}>
          <StyledText
            as="p"
            marginLeft={SPACING.spacing3}
            marginRight={SPACING.spacing2}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {['X', 'Y', 'Z'][index]}
          </StyledText>
          <StyledText as="p">{axis.toFixed(1)}</StyledText>
        </React.Fragment>
      ))}
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

