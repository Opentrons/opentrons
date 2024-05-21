import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { getPipetteSpecsV2, RIGHT, LEFT } from '@opentrons/shared-data'
import { LargeButton } from '../../atoms/buttons'
import { ChildNavigation } from '../ChildNavigation'

import type { PipetteData, Mount } from '@opentrons/api-client'
import type { SmallButton } from '../../atoms/buttons'
import type {
  QuickTransferWizardState,
  QuickTransferWizardAction,
} from './types'

interface SelectPipetteProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: React.ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  dispatch: React.Dispatch<QuickTransferWizardAction>
}

export function SelectPipette(props: SelectPipetteProps): JSX.Element {
  const { onNext, onBack, exitButtonProps, state, dispatch } = props
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const { data: attachedInstruments } = useInstrumentsQuery()

  const leftPipette = attachedInstruments?.data.find(
    (i): i is PipetteData => i.ok && i.mount === LEFT
  )
  const leftPipetteSpecs =
    leftPipette != null ? getPipetteSpecsV2(leftPipette.instrumentModel) : null

  const rightPipette = attachedInstruments?.data.find(
    (i): i is PipetteData => i.ok && i.mount === RIGHT
  )
  const rightPipetteSpecs =
    rightPipette != null
      ? getPipetteSpecsV2(rightPipette.instrumentModel)
      : null

  // automatically select 96 channel if it is attached
  const [selectedPipette, setSelectedPipette] = React.useState<
    Mount | undefined
  >(leftPipetteSpecs?.channels === 96 ? LEFT : state.mount)

  const handleClickNext = (): void => {
    const selectedPipetteSpecs =
      selectedPipette === LEFT ? leftPipetteSpecs : rightPipetteSpecs

    // the button will be disabled if these values are null
    if (selectedPipette != null && selectedPipetteSpecs != null) {
      dispatch({
        type: 'SELECT_PIPETTE',
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
        gridGap={SPACING.spacing4}
      >
        <StyledText
          css={TYPOGRAPHY.level4HeaderRegular}
          paddingBottom={SPACING.spacing8}
        >
          {t('pipette_currently_attached')}
        </StyledText>
        {leftPipetteSpecs != null ? (
          <LargeButton
            buttonType={selectedPipette === LEFT ? 'primary' : 'secondary'}
            onClick={() => {
              setSelectedPipette(LEFT)
            }}
            buttonText={
              leftPipetteSpecs.channels === 96
                ? t('both_mounts')
                : t('left_mount')
            }
            subtext={leftPipetteSpecs.displayName}
          />
        ) : null}
        {rightPipetteSpecs != null ? (
          <LargeButton
            buttonType={selectedPipette === RIGHT ? 'primary' : 'secondary'}
            onClick={() => {
              setSelectedPipette(RIGHT)
            }}
            buttonText={t('right_mount')}
            subtext={rightPipetteSpecs.displayName}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
