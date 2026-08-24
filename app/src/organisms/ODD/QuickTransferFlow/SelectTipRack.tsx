import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
} from '@opentrons/components'
import {
  getAllDefinitions,
  LABWAREV2_DO_NOT_LIST,
} from '@opentrons/shared-data'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { ACTIONS } from './constants'

import type { ComponentProps, Dispatch, ReactNode } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { SmallButton } from '/app/atoms/buttons'
import type {
  QuickTransferWizardAction,
  QuickTransferWizardState,
} from './types'

interface SelectTipRackProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  dispatch: Dispatch<QuickTransferWizardAction>
}

export function SelectTipRack(props: SelectTipRackProps): ReactNode {
  const { onNext, onBack, exitButtonProps, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])

  // (kk:2025-09-30) this should be temporary until fix getAllDefinitions cache issue

  const allLabwareDefinition2sByUri = getAllDefinitions()
  const selectedPipetteDefaultTipracks =
    state.pipette?.liquids.default.defaultTipracks.filter(tiprackUri => {
      // "opentrons/opentrons_flex_96_tiprack_20ul/1" -> "opentrons_flex_96_tiprack_20ul"
      const loadName = tiprackUri.split('/')[1]
      const isBlockedTiprack = LABWAREV2_DO_NOT_LIST.has(loadName)
      return !isBlockedTiprack
    }) ?? []

  const [selectedTipRack, setSelectedTipRack] = useState<
    LabwareDefinition2 | undefined
  >(state.tipRack)

  const handleClickNext = (): void => {
    // the button will be disabled if this values is null
    if (selectedTipRack != null) {
      dispatch({
        type: ACTIONS.SELECT_TIP_RACK,
        tipRack: selectedTipRack,
      })
      onNext()
    }
  }
  return (
    <Flex>
      <ChildNavigation
        header={t('select_tip_rack')}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickNext}
        secondaryButtonProps={exitButtonProps}
        top={SPACING.spacing8}
        buttonIsDisabled={selectedTipRack == null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing32} ${SPACING.spacing60} ${SPACING.spacing40}`}
        gridGap={SPACING.spacing8}
        width="100%"
      >
        {selectedPipetteDefaultTipracks.map(tipRack => {
          const tipRackDef = allLabwareDefinition2sByUri[tipRack]

          return tipRackDef != null ? (
            <RadioButton
              key={tipRack}
              isSelected={selectedTipRack === tipRackDef}
              buttonValue={tipRack}
              buttonLabel={tipRackDef.metadata.displayName}
              onChange={() => {
                setSelectedTipRack(tipRackDef)
              }}
            />
          ) : null
        })}
      </Flex>
    </Flex>
  )
}
