// @flow

import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link as RRDLink } from 'react-router-dom'


import type { State } from '../../types'
import * as Robot from '../../robot'
import * as Pipettes from '../../pipettes'
import * as Calibration from '../../calibration'
import * as CustomLabware from '../../custom-labware'

import {
  Box,
  Flex,
  Link,
  Text,
  ALIGN_START,
  JUSTIFY_SPACE_BETWEEN,
  BORDER_SOLID_LIGHT,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  FONT_SIZE_BODY_1,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  SPACING_AUTO,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'

import type { ViewableRobot } from '../../discovery/types'

import { PipetteOffsetItem } from './PipetteOffsetItem'

const TITLE = 'attached pipette calibration'
const DESCRIPTION =
  'Calibration status for currently attached pipettes. See information about all pipettes and calibration under'

const LINK_TEXT = 'Robot > Pipettes and Modules'

type Props = {|
  pipettesPageUrl: string,
  robot: ViewableRobot,
|}

export function PipetteOffsets(props: Props): React.Node {
  const { pipettesPageUrl, robot } = props
  const { name: robotName, status } = robot

  const attachedPipettes = useSelector((state: State) => {
    return Pipettes.getAttachedPipettes(state, robotName)
  })

  const pipetteCalibrations = useSelector((state: State) => {
    return Pipettes.getAttachedPipetteCalibrations(state, robotName)
  })

  const customLabwareDefs = useSelector((state: State) => {
    return CustomLabware.getCustomLabwareDefinitions(state)
  })

  return (
    <Box
      padding={SPACING_3}
      borderBottom={BORDER_SOLID_LIGHT}
      fontSize={FONT_SIZE_BODY_1}
    >
      <Flex alignItems={ALIGN_START} flexDirection={DIRECTION_COLUMN}>
        <Box paddingRight={SPACING_3} marginRight={SPACING_AUTO}>
          <Text
            as="h4"
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            marginBottom={SPACING_2}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
          >
            {TITLE}
          </Text>
          <Text>
            {`${DESCRIPTION} `}
            <Link as={RRDLink} to={pipettesPageUrl}>
              {LINK_TEXT}
            </Link>
          </Text>
        </Box>
        <Flex width={'100%'} paddingTop={SPACING_4}>
          <PipetteOffsetItem
            mount={'left'}
            pipette={attachedPipettes.left}
            calibration={pipetteCalibrations.left}
            customLabware={customLabwareDefs}
          />
          <PipetteOffsetItem
            mount={'right'}
            pipette={attachedPipettes.right}
            calibration={pipetteCalibrations.right}
            customLabware={customLabwareDefs}
          />
        </Flex>
      </Flex>
    </Box>
  )
}
