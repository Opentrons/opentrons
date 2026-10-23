import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { LEFT, RIGHT } from '@opentrons/shared-data'

import { usePipetteSpecsV2 } from '/app/local-resources/instruments'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { ACTIONS } from './constants'

import type { ComponentProps, Dispatch, ReactNode } from 'react'
import type { Mount, PipetteData } from '@opentrons/api-client'
import type { SmallButton } from '/app/atoms/buttons'
import type {
  QuickTransferWizardAction,
  QuickTransferWizardState,
} from './types'

interface SelectPipetteProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  dispatch: Dispatch<QuickTransferWizardAction>
}

export function SelectPipette(props: SelectPipetteProps): ReactNode {
  const { onNext, onBack, exitButtonProps, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const { data: attachedInstruments } = useInstrumentsQuery()

  const leftPipette = attachedInstruments?.data.find(
    (i): i is PipetteData => i.ok && i.mount === LEFT
  )
  const leftPipetteSpecs = usePipetteSpecsV2(leftPipette?.instrumentModel)

  const rightPipette = attachedInstruments?.data.find(
    (i): i is PipetteData => i.ok && i.mount === RIGHT
  )
  const rightPipetteSpecs = usePipetteSpecsV2(rightPipette?.instrumentModel)

  // automatically select 96 channel if it is attached
  const [selectedPipette, setSelectedPipette] = useState<Mount | undefined>(
    leftPipetteSpecs?.channels === 96 ? LEFT : state.mount
  )

  const handleClickNext = (): void => {
    const selectedPipetteSpecs =
      selectedPipette === LEFT ? leftPipetteSpecs : rightPipetteSpecs

    // the button will be disabled if these values are null
    if (selectedPipette != null && selectedPipetteSpecs != null) {
      dispatch({
        type: ACTIONS.SELECT_PIPETTE,
        pipette: selectedPipetteSpecs,
        mount: selectedPipette,
      })
      onNext()
    }
  }
  return (
    <Flex>
      <ChildNavigation
        header={t('select_attached_pipette')}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickNext}
        secondaryButtonProps={exitButtonProps}
        top={SPACING.spacing8}
        buttonIsDisabled={selectedPipette == null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing8}
      >
        <StyledText
          oddStyle="level4HeaderRegular"
          paddingBottom={SPACING.spacing16}
        >
          {t('pipette_currently_attached')}
        </StyledText>
        {leftPipetteSpecs != null ? (
          <RadioButton
            isSelected={selectedPipette === LEFT}
            onChange={() => {
              setSelectedPipette(LEFT)
            }}
            buttonValue={LEFT}
            buttonLabel={
              leftPipetteSpecs.channels === 96
                ? t('both_mounts')
                : t('left_mount')
            }
            buttonSubLabel={{
              label: leftPipetteSpecs.displayName,
              align: 'vertical',
            }}
          />
        ) : null}
        {rightPipetteSpecs != null ? (
          <RadioButton
            isSelected={selectedPipette === RIGHT}
            onChange={() => {
              setSelectedPipette(RIGHT)
            }}
            buttonValue={RIGHT}
            buttonLabel={t('right_mount')}
            buttonSubLabel={{
              label: rightPipetteSpecs.displayName,
              align: 'vertical',
            }}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
