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

import { SmallButton, TabbedButton } from '../../atoms/buttons'
import { ChildNavigation } from '../ChildNavigation'
import { Overview } from './Overview'

import type { QuickTransferSetupState } from './types'

interface SummaryAndSettingsProps {
  onNext: () => void
  exitButtonProps: React.ComponentProps<typeof SmallButton>
  state: QuickTransferSetupState
}

export function SummaryAndSettings(
  props: SummaryAndSettingsProps
): JSX.Element | null {
  const { onNext, exitButtonProps, state } = props
  const { t } = useTranslation(['quick_transfer', 'shared'])
  const displayCategory: string[] = [
    'overview',
    'advanced_settings',
    'tip_management',
  ]
  const [selectedCategory, setSelectedCategory] = React.useState<string>(
    'overview'
  )

  return (
    <Flex>
      <ChildNavigation
        header={t('quick_transfer_volume', { volume: state.volume })}
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
