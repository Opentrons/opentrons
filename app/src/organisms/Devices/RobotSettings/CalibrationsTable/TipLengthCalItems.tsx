import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  Flex,
  DIRECTION_ROW,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { Divider } from '../../../../atoms/structure'
import { OverflowMenu } from './OverflowMenu'
import { formatLastCalibrated } from './utils'
import { getDisplayNameForTipRack } from '../../../../pages/Robots/InstrumentSettings/utils'
import { getCustomLabwareDefinitions } from '../../../../redux/custom-labware'
import { TipLengthCalHeader } from './TipLengthCalHeader'

import type {
  FormattedPipetteOffsetCalibration,
  FormattedTipLengthCalibration,
} from '../RobotSettingsCalibration'
import type { State } from '../../../../redux/types'

interface TipLengthCallItemsProps {
  robotName: string
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
  formattedTipLengthCalibrations: FormattedTipLengthCalibration[]
}

export function TipLengthCalItems({
  robotName,
  formattedPipetteOffsetCalibrations,
  formattedTipLengthCalibrations,
}: TipLengthCallItemsProps): JSX.Element {
  const customLabwareDefs = useSelector((state: State) => {
    return getCustomLabwareDefinitions(state)
  })
  const tipLengthCalibrations = formattedTipLengthCalibrations.map(
    tipLength => {
      return {
        modelName: formattedPipetteOffsetCalibrations.find(
          p => p.serialNumber === tipLength.pipette
        )?.modelName,
        serialNumber: tipLength.pipette,
        mount: formattedPipetteOffsetCalibrations.find(
          p => p.serialNumber === tipLength.pipette
        )?.mount,
        tiprack: tipLength.uri,
        lastCalibrated: tipLength.lastCalibrated,
      }
    }
  )

  return (
    <>
      <TipLengthCalHeader />
      {tipLengthCalibrations.map((calibration, index) => (
        <React.Fragment key={index}>
          <Divider />
          <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
            <Flex
              css={{ 'word-wrap': 'break-word' }}
              marginRight={SPACING.spacing4}
            >
              <StyledText
                as="p"
                width="13.375rem"
                marginLeft={SPACING.spacing4}
              >
                {getDisplayNameForTipRack(
                  calibration.tiprack,
                  customLabwareDefs
                )}
              </StyledText>
            </Flex>
            <Flex
              flexDirection={DIRECTION_COLUMN}
              width="11.75rem"
              css={{ 'word-wrap': 'break-word' }}
            >
              <StyledText as="p">{calibration.modelName}</StyledText>
              <StyledText as="p">{calibration.serialNumber}</StyledText>
            </Flex>
            <StyledText as="p" width="12.5rem">
              {formatLastCalibrated(calibration.lastCalibrated)}
            </StyledText>
            <OverflowMenu
              calType="tipLength"
              robotName={robotName}
              mount={calibration.mount}
            />
          </Flex>
        </React.Fragment>
      ))}
    </>
  )
}
