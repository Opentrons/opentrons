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
  Box,
  ALIGN_FLEX_START,
  ALIGN_STRETCH,
  SIZE_3
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
import { Banner } from '../../atoms/Banner'


const RELATIVELY_HIGH_Z = 200
interface LiveControlsProps {
  runId: string
  robotModel: RobotModel
}
export const LiveControls = (props: LiveControlsProps): JSX.Element | null => {
  const { runId, robotModel } = props
  const attachedPipettes = useAttachedPipettes(false)
  const { createRunCommand, isLoading: isCommandInProgress } = useCreateRunCommandMutation(runId)
  const [lastKnownPosition, setLastKnownPosition] = React.useState<VectorOffset | null>({ x: 0, y: 0, z: RELATIVELY_HIGH_Z })
  const [lastError, setLastError] = React.useState<string>('')

  let setupCommands: CreateCommand[] = [
    { commandType: 'home', params: { axes: [] } }
  ]
  if (attachedPipettes.left != null) {
    setupCommands = [...setupCommands, {
      commandType: 'loadPipette',
      params: {
        pipetteName: attachedPipettes.left.name,
        pipetteId: attachedPipettes.left.id,
        mount: 'left'
      }
    }]
  }
  if (attachedPipettes.right != null) {
    setupCommands = [...setupCommands, {
      commandType: 'loadPipette',
      params: {
        pipetteName: attachedPipettes.right.name,
        pipetteId: attachedPipettes.right.id,
        mount: 'right'
      }
    }]
  }
  React.useEffect(() => {
    setupCommands.forEach(c => {
      createRunCommand({ command: c })
        .then(() => { })
        .catch(e => {
          setLastError(e.message)
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
          data.result?.position != null && setLastKnownPosition(data.result?.position ?? null)
        })
        .catch(e => {
          setLastError(e.message)
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
          console.log('jog DATA', data)
          setLastKnownPosition(data.result?.position ?? null)
        })
        .catch((e: Error) => {
          setLastError(e.message)
          console.error(`error issuing jog command: ${e.message}`)
        })
    } else {
      setLastError(`No Pipette found on mount: ${selectedMount}`)
    }
  }
  const handleMoveToXYCoords = (x: number, y: number): void => {
    if (pipetteId != null) {
      createRunCommand({
        command: {
          commandType: 'moveToCoordinates',
          params: { pipetteId, coordinates: { x, y, z: lastKnownPosition?.z || RELATIVELY_HIGH_Z } },
        },
        waitUntilComplete: true
      })
        .then(({ data }) => {
          console.log('to coord DATA', data)
          setLastKnownPosition(data.result?.position ?? null)
        })
        .catch((e: Error) => {
          setLastError(e.message)
          console.error(`error issuing jog command: ${e.message}`)
        })
    } else {
      setLastError(`No Pipette found on mount: ${selectedMount}`)
    }
  }


  return (
    <Flex flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_CENTER}>
      <Flex minHeight={SIZE_3}>
      {isCommandInProgress ? <Icon spin name="ot-spinner" size={SIZE_3} /> : null}
      </Flex>
      <Flex alignSelf={ALIGN_STRETCH} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Box flex="9">
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing3} alignItems={ALIGN_FLEX_START}>
            <Flex alignSelf={ALIGN_STRETCH} gridGap={SPACING.spacing2} alignItems={ALIGN_CENTER} justifyContent={JUSTIFY_SPACE_BETWEEN}>
              <StyledText as="h6" >
                Mount To Control
              </StyledText>
              {toggleGroup}
            </Flex>
            <JogControls
              flexWrap='wrap'
              jog={(axis, direction, step, _onSuccess) =>
                handleJog(axis, direction, step)
              }
            />
            <CurrentCoords lastKnownPosition={lastKnownPosition} />
            {lastError !== '' ? <Banner type="error" onCloseClick={() => setLastError('')}>{lastError}</Banner> : null}
          </Flex>
        </Box>
        <Flex flex="13" gridGap={SPACING.spacing2} flexDirection={DIRECTION_COLUMN} alignItems={ALIGN_FLEX_START}>
          <DeckView {...{ robotModel, lastKnownPosition, handleMoveToXYCoords }} />
        </Flex>
      </Flex>
    </Flex>
  )
}

interface CurrentCoordsProps { lastKnownPosition: VectorOffset | null }
function CurrentCoords(props: CurrentCoordsProps): JSX.Element {
  const { lastKnownPosition } = props
  return (
    <Flex alignSelf={ALIGN_STRETCH} justifyContent={JUSTIFY_SPACE_BETWEEN}>
      <StyledText as="h6">Last Known Position</StyledText>
      <Flex
        flex="0 1 auto"
        alignItems={ALIGN_CENTER}
        border={`${BORDERS.styleSolid} ${SPACING.spacingXXS} ${COLORS.lightGreyHover}`}
        borderRadius={BORDERS.radiusSoftCorners}
        padding={SPACING.spacing3}
      >
        <Icon name="reticle" size={SIZE_1} />
        {lastKnownPosition != null ? [lastKnownPosition.x, lastKnownPosition.y, lastKnownPosition.z].map((axis, index) => (
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
        )) : <StyledText as="p">UNKNOWN</StyledText>}
      </Flex></Flex>
  )
}


