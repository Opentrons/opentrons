import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_ROW,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
  Icon,
  COLORS,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'

import { StyledText } from '../../../../atoms/text'
import { Divider } from '../../../../atoms/structure'
import { OverflowMenu } from './OverflowMenu'
import { formatLastCalibrated } from './utils'
import { getDisplayNameForTipRack } from '../../../../pages/Robots/InstrumentSettings/utils'
import { getCustomLabwareDefinitions } from '../../../../redux/custom-labware'
import { PipetteOffsetCalHeader } from './PipetteOffsetCalHeader'

import type { State } from '../../../../redux/types'
import type { FormattedPipetteOffsetCalibration } from '../RobotSettingsCalibration'
interface PipetteOffsetCalItemsProps {
  robotName: string
  formattedPipetteOffsetCalibrations: FormattedPipetteOffsetCalibration[]
}

export function PipetteOffsetCalItems({
  robotName,
  formattedPipetteOffsetCalibrations,
}: PipetteOffsetCalItemsProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  const customLabwareDefs = useSelector((state: State) => {
    return getCustomLabwareDefinitions(state)
  })

  return (
    <>
      <PipetteOffsetCalHeader />
      {formattedPipetteOffsetCalibrations.map((calibration, index) => (
        <React.Fragment key={index}>
          <Divider />
          <Flex flexDirection={DIRECTION_ROW} alignItems={ALIGN_CENTER}>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <StyledText as="p" width="100%">
                {calibration.modelName}
              </StyledText>
              <StyledText as="p" width="100%">
                {calibration.serialNumber}
              </StyledText>
            </Flex>
            <StyledText
              as="p"
              width="100%"
              marginLeft={SPACING.spacing4}
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
            >
              {calibration.mount}
            </StyledText>
            <Flex
              css={{ 'word-wrap': 'break-word' }}
              marginLeft={SPACING.spacing4}
            >
              <StyledText as="p" width="100%" height="2.5rem">
                {getDisplayNameForTipRack(
                  calibration.tiprack,
                  customLabwareDefs
                )}
              </StyledText>
            </Flex>

            <Flex alignItems={ALIGN_CENTER}>
              {calibration.lastCalibrated != null ? (
                <>
                  <StyledText as="p">
                    {formatLastCalibrated(calibration.lastCalibrated)}
                  </StyledText>
                </>
              ) : (
                <>
                  {calibration.markedBad ?? false ? (
                    <Icon
                      name="alert-circle"
                      backgroundColor={COLORS.warningBg}
                      color={COLORS.warning}
                      // size={SPACING.spacing4}
                      height={SPACING.spacing4}
                      // marginRight={SPACING.spacing2}
                    />
                  ) : (
                    <Icon
                      name="alert-circle"
                      backgroundColor={COLORS.errorBg}
                      color={COLORS.error}
                      height={SPACING.spacing4}
                      // size={SPACING.spacing4}
                      // marginRight={SPACING.spacing2}
                    />
                  )}
                  <StyledText as="p" marginLeft={SPACING.spacing4} width="100%">
                    {t('missing_calibration')}
                  </StyledText>
                </>
              )}
            </Flex>

            <OverflowMenu
              calType="pipetteOffset"
              robotName={robotName}
              serialNumber={calibration.serialNumber}
              mount={calibration.mount}
            />
          </Flex>
        </React.Fragment>
      ))}
    </>
  )
}
