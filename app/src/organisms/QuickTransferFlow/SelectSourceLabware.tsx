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

import { LargeButton, TabbedButton } from '../../atoms/buttons'
import { ChildNavigation } from '../ChildNavigation'
import { getCompatibleLabwareByCategory } from './utils'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { SmallButton } from '../../atoms/buttons'
import type { LabwareFilter } from '../../pages/Labware/types'
import type {
  QuickTransferWizardState,
  QuickTransferWizardAction,
} from './types'

interface SelectSourceLabwareProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: React.ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  dispatch: React.Dispatch<QuickTransferWizardAction>
}

export function SelectSourceLabware(
  props: SelectSourceLabwareProps
): JSX.Element | null {
  const { onNext, onBack, exitButtonProps, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const labwareDisplayCategoryFilters: LabwareFilter[] = [
    'all',
    'wellPlate',
    'reservoir',
  ]
  if (state.pipette?.channels === 1) {
    labwareDisplayCategoryFilters.push('tubeRack')
  }
  const [selectedCategory, setSelectedCategory] = React.useState<LabwareFilter>(
    'all'
  )

  const [selectedLabware, setSelectedLabware] = React.useState<
    LabwareDefinition2 | undefined
  >(state.source)

  if (state.pipette == null) return null

  const compatibleLabwareDefinitions = getCompatibleLabwareByCategory(
    state.pipette.channels,
    selectedCategory
  )

  const handleClickNext = (): void => {
    // the button will be disabled if this values is null
    if (selectedLabware != null) {
      dispatch({
        type: 'SET_SOURCE_LABWARE',
        labware: selectedLabware,
      })
      onNext()
    }
  }
  return (
    <Flex>
      <ChildNavigation
        header={t('select_source_labware')}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickNext}
        secondaryButtonProps={exitButtonProps}
        top={SPACING.spacing8}
        buttonIsDisabled={selectedLabware == null}
      />
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
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
          {labwareDisplayCategoryFilters.map(category => (
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
        <Flex
          gridGap={SPACING.spacing4}
          flexDirection={DIRECTION_COLUMN}
          marginTop="175px"
        >
          {compatibleLabwareDefinitions?.map(definition => {
            return definition.metadata.displayName != null ? (
              <LargeButton
                key={`${selectedCategory}-${definition.metadata.displayName}`}
                buttonType={
                  selectedLabware?.metadata.displayName ===
                  definition.metadata.displayName
                    ? 'primary'
                    : 'secondary'
                }
                onClick={() => {
                  setSelectedLabware(definition)
                }}
                buttonText={definition.metadata.displayName}
              />
            ) : null
          })}
        </Flex>
      </Flex>
    </Flex>
  )
}
