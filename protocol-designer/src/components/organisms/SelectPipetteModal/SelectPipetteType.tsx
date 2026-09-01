import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
  WRAP,
} from '@opentrons/components'

import { PIPETTE_TYPES } from '/protocol-designer/pages/Onboarding/constants'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import type { PipetteMount, RobotType } from '@opentrons/shared-data'
import type {
  Gen,
  PipetteType,
} from '/protocol-designer/pages/Onboarding/types'
import type { FormPipettesByMount } from '/protocol-designer/step-forms'

interface SelectPipetteTypeProps {
  mount: PipetteMount
  robotType: RobotType
  pipettesByMount: FormPipettesByMount
  setPipetteGen: Dispatch<SetStateAction<'flex' | Gen>>
  setPipetteVolume: Dispatch<SetStateAction<string | null>>
  setPipetteType: Dispatch<SetStateAction<PipetteType | null>>
  pipetteType: PipetteType | null
  setValue: UseFormSetValue<any>
}

export function SelectPipetteType(props: SelectPipetteTypeProps): ReactNode {
  const {
    mount,
    robotType,
    pipettesByMount,
    setPipetteGen,
    setPipetteVolume,
    setPipetteType,
    pipetteType,
    setValue,
  } = props
  const { t } = useTranslation('onboarding')
  const handleSelectPipetteType = (value: PipetteType): void => {
    setPipetteType(value)
    setPipetteGen('flex')
    setPipetteVolume(null)
    setValue(`pipettesByMount.${mount}.pipetteName`, undefined)
    setValue(`pipettesByMount.${mount}.tiprackDefURI`, undefined)
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
      <StyledText desktopStyle="headingSmallBold">
        {t('pipette_type')}
      </StyledText>
      <Flex gridGap={SPACING.spacing4} flexWrap={WRAP}>
        {PIPETTE_TYPES[robotType].map(type => {
          return type.value === '96' &&
            (mount === 'right' ||
              (mount === 'left' &&
                pipettesByMount.right.pipetteName != null)) ? null : (
            <RadioButton
              key={`${type.label}_${type.value}`}
              onChange={() => {
                handleSelectPipetteType(type.value)
              }}
              buttonLabel={t(`shared:${type.label}`)}
              buttonValue="single"
              isSelected={pipetteType === type.value}
            />
          )
        })}
      </Flex>
    </Flex>
  )
}
