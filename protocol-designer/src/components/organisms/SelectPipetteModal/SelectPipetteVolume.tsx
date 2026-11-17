import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
  WRAP,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { PIPETTE_VOLUMES } from '/protocol-designer/pages/Onboarding/constants'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { RobotType } from '@opentrons/shared-data'
import type {
  Gen,
  PipetteInfoByGen,
  PipetteInfoByType,
  PipetteType,
} from '/protocol-designer/pages/Onboarding/types'

interface SelectPipetteVolumeProps {
  pipetteGen: Gen | 'flex'
  robotType: RobotType
  pipetteVolume: string | null
  setPipetteVolume: Dispatch<SetStateAction<string | null>>
  pipetteType: PipetteType
}

export function SelectPipetteVolume(
  props: SelectPipetteVolumeProps
): ReactNode {
  const {
    robotType,
    setPipetteVolume,
    pipetteType,
    pipetteGen,
    pipetteVolume,
  } = props
  const { t } = useTranslation('onboarding')

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
      <StyledText desktopStyle="headingSmallBold">
        {t('pipette_vol')}
      </StyledText>
      <Flex gridGap={SPACING.spacing4} flexWrap={WRAP}>
        {PIPETTE_VOLUMES[robotType]?.map(volume => {
          if (robotType === FLEX_ROBOT_TYPE && pipetteType != null) {
            const flexVolume = volume as PipetteInfoByType
            const flexPipetteInfo = flexVolume[pipetteType]

            return flexPipetteInfo?.map(type => (
              <RadioButton
                key={`${type.value}_${pipetteType}`}
                onChange={() => {
                  setPipetteVolume(type.value)
                }}
                buttonLabel={t('vol_label', { volume: type.label })}
                buttonValue={type.value}
                isSelected={pipetteVolume === type.value}
              />
            ))
          } else {
            const ot2Volume = volume as PipetteInfoByGen
            //  asserting gen is defined from previous turnary statement
            const gen = pipetteGen as Gen

            return ot2Volume[gen].map(info => {
              return info[pipetteType]?.map(type => (
                <RadioButton
                  key={`${type.value}_${pipetteGen}_${pipetteType}`}
                  onChange={() => {
                    setPipetteVolume(type.value)
                  }}
                  buttonLabel={t('vol_label', {
                    volume: type.label,
                  })}
                  buttonValue={type.value}
                  isSelected={pipetteVolume === type.value}
                />
              ))
            })
          }
        })}
      </Flex>
    </Flex>
  )
}
