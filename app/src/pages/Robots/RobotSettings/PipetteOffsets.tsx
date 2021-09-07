import * as React from 'react'
import { useSelector } from 'react-redux'
import { Link as RRDLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import type { State } from '../../../redux/types'
import * as Pipettes from '../../../redux/pipettes'
import * as CustomLabware from '../../../redux/custom-labware'

import { TitledControl } from '../../../atoms/TitledControl'

import {
  Flex,
  ALIGN_START,
  BORDER_SOLID_LIGHT,
  DIRECTION_COLUMN,
  SPACING_3,
  SPACING_4,
  SecondaryBtn,
} from '@opentrons/components'

import type { ViewableRobot } from '../../../redux/discovery/types'

import { PipetteOffsetItem } from './PipetteOffsetItem'

interface Props {
  pipettesPageUrl: string
  robot: ViewableRobot
}

export function PipetteOffsets(props: Props): JSX.Element {
  const { pipettesPageUrl, robot } = props
  const { name: robotName } = robot

  const { t } = useTranslation('robot_calibration')
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
    <TitledControl
      padding={SPACING_3}
      borderBottom={BORDER_SOLID_LIGHT}
      title={t('attached_pipettes')}
      description={t('pipette_offset_description')}
      control={
        <SecondaryBtn as={RRDLink} to={pipettesPageUrl}>
          {t('manage_pipettes')}
        </SecondaryBtn>
      }
    >
      <Flex
        alignItems={ALIGN_START}
        flexDirection={DIRECTION_COLUMN}
        marginBottom={SPACING_3}
      >
        <Flex width={'100%'} paddingTop={SPACING_4}>
          <PipetteOffsetItem
            mount="left"
            pipette={attachedPipettes.left}
            calibration={pipetteCalibrations.left}
            customLabware={customLabwareDefs}
          />
          <PipetteOffsetItem
            mount="right"
            pipette={attachedPipettes.right}
            calibration={pipetteCalibrations.right}
            customLabware={customLabwareDefs}
          />
        </Flex>
      </Flex>
    </TitledControl>
  )
}
