import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
  WRAP,
} from '@opentrons/components'

import { PIPETTE_GENS } from '/protocol-designer/pages/Onboarding/constants'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import type { Gen } from '/protocol-designer/pages/Onboarding/types'

interface SelectPipetteGenProps {
  setPipetteGen: Dispatch<SetStateAction<'flex' | Gen>>
  setPipetteVolume: Dispatch<SetStateAction<string | null>>
  pipetteGen: Gen | 'flex'
}

export function SelectPipetteGen(props: SelectPipetteGenProps): ReactNode {
  const { setPipetteGen, setPipetteVolume, pipetteGen } = props
  const { t } = useTranslation('onboarding')

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      flexWrap={WRAP}
    >
      <StyledText desktopStyle="headingSmallBold">
        {t('pipette_gen')}
      </StyledText>
      <Flex gridGap={SPACING.spacing4}>
        {PIPETTE_GENS.map(gen => (
          <RadioButton
            key={gen}
            onChange={() => {
              setPipetteGen(gen)
              setPipetteVolume(null)
            }}
            buttonLabel={gen}
            buttonValue={gen}
            isSelected={pipetteGen === gen}
          />
        ))}
      </Flex>
    </Flex>
  )
}
