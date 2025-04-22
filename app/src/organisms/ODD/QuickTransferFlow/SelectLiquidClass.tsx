import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  //   RadioButton,
  SPACING,
  StyledText,
  //   StyledText,
  //   TYPOGRAPHY,
} from '@opentrons/components'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import type { ComponentProps, Dispatch } from 'react'
import type { SmallButton } from '/app/atoms/buttons'
import type {
  QuickTransferWizardAction,
  QuickTransferWizardState,
} from './types'

interface SelectLiquidClassProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  dispatch: Dispatch<QuickTransferWizardAction>
}
export function SelectLiquidClass({
  onNext,
  onBack,
  exitButtonProps,
  state,
  dispatch,
}: SelectLiquidClassProps): JSX.Element {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])

  const handleClickNext = (): void => {
    // dispatch to set pipette path
    onNext()
  }

  return (
    <Flex>
      <ChildNavigation
        header={t('select_liquid_class')}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickNext}
        secondaryButtonProps={exitButtonProps}
        top={SPACING.spacing8}
        // if selected liquid class is null
        // buttonIsDisabled={selectedPipette == null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing4}
      >
        <StyledText oddStyle="level4HeaderRegular">
          {t('apply_predefined_settings')}
        </StyledText>
        {/* radio buttons */}
      </Flex>
    </Flex>
  )
}
