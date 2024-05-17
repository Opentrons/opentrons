import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  COLORS,
  POSITION_FIXED,
  ALIGN_CENTER,
} from '@opentrons/components'

import { TabbedButton } from '../../atoms/buttons'
import { ChildNavigation } from '../ChildNavigation'
import { Overview } from './Overview'
import { getInitialSummaryState } from './utils'
import { quickTransferSummaryReducer } from './reducers'

import type { SmallButton } from '../../atoms/buttons'
import type { QuickTransferWizardState } from './types'

interface SummaryAndSettingsProps {
  onNext: () => void
  exitButtonProps: React.ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
}

export function SummaryAndSettings(
  props: SummaryAndSettingsProps
): JSX.Element | null {
  const { onNext, exitButtonProps, state: wizardFlowState } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const displayCategory: string[] = [
    'overview',
    'advanced_settings',
    'tip_management',
  ]
  const [selectedCategory, setSelectedCategory] = React.useState<string>(
    'overview'
  )
  // @ts-expect-error TODO figure out how to make this type non-null as we know
  // none of these values will be undefined
  const initialSummaryState = getInitialSummaryState(wizardFlowState)
  const [state] = React.useReducer(
    quickTransferSummaryReducer,
    initialSummaryState
  )

  return (
    <Flex>
      <ChildNavigation
        header={t('quick_transfer_volume', { volume: wizardFlowState.volume })}
        buttonText={t('create_transfer')}
        onClickButton={onNext}
        secondaryButtonProps={exitButtonProps}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing40} ${SPACING.spacing40} ${SPACING.spacing40}`}
        width="100%"
      >
        <Flex
          gridGap={SPACING.spacing8}
          height={SPACING.spacing80}
          backgroundColor={COLORS.white}
          width="100%"
          flexDirection={DIRECTION_ROW}
          position={POSITION_FIXED}
          top={SPACING.spacing120}
          marginBottom={SPACING.spacing24}
          alignItems={ALIGN_CENTER}
        >
          {displayCategory.map(category => (
            <TabbedButton
              key={category}
              title={category}
              isSelected={category === selectedCategory}
              onClick={() => setSelectedCategory(category)}
              height={SPACING.spacing60}
            >
              {t(category)}
            </TabbedButton>
          ))}
        </Flex>
        {selectedCategory === 'overview' ? <Overview state={state} /> : null}
      </Flex>
    </Flex>
  )
}
