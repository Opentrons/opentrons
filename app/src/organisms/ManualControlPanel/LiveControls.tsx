import * as React from 'react'
import {
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  SPACING,
  ALIGN_CENTER,
  COLORS,
  BORDERS,
  TYPOGRAPHY,
  SIZE_1,
  Box
} from '@opentrons/components'
import { JogControls } from '../../molecules/JogControls'

import { useAttachedPipettes } from '../Devices/hooks'
import { useCreateRunCommandMutation } from '../../resources/runs/hooks'
import { useToggleGroup } from '../../molecules/ToggleGroup/useToggleGroup'
import { Mount, VectorOffset } from '@opentrons/api-client'
import { DeckView } from './DeckView'
import { StyledText } from '../../atoms/text'

import type { CreateCommand } from '@opentrons/shared-data'
import type { Axis, Sign, StepSize } from '../../molecules/JogControls/types'
import type { RobotModel } from '../../redux/discovery/types'

interface LiveControlsProps {
  runId: string
  robotModel: RobotModel
}
export const LiveControls = (props: LiveControlsProps): JSX.Element | null => {
  const { runId, robotModel } = props
  const attachedPipettes = useAttachedPipettes(false)
  const { createRunCommand } = useCreateRunCommandMutation(runId)
  const [lastKnownPosition, setLastKnownPosition] = React.useState<VectorOffset>({ x: 0, y: 0, z: 100 })

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
  const pipetteId = attachedPipettes[selectedMount as Mount]?.id

  React.useEffect(() => {
    if (pipetteId != null) {
      createRunCommand({
        command: {
          commandType: 'savePosition',
          params: { pipetteId }
        },
        waitUntilComplete: true
      })
        .then(({ data }) => {
          data.result?.position != null && setLastKnownPosition(data.result?.position)
        })
        .catch(e => {
          console.error(`error issuing save position command: ${e.message}`)
        })
    }
  }, [pipetteId])

  const handleJog = (
    axis: Axis,
    dir: Sign,
    step: StepSize,
  ): void => {
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
  const handleMoveToXYCoords = (x: number, y: number): void => {
    if (pipetteId != null) {
      createRunCommand({
        command: {
          commandType: 'moveToCoordinates',
          params: { pipetteId, coordinates: { x, y, z: lastKnownPosition.z } },
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
    <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <Box flex="2">
        <Flex flexDirection={DIRECTION_COLUMN}>
          {toggleGroup}
          <JogControls
            flexWrap='wrap'
            jog={(axis, direction, step, _onSuccess) =>
              handleJog(axis, direction, step)
            }
          />
        </Flex>
      </Box>
      <Flex flex="3" flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
        <DeckView {...{ robotModel, lastKnownPosition, handleMoveToXYCoords }} />
        <CurrentCoords lastKnownPosition={lastKnownPosition} />
      </Flex>
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


