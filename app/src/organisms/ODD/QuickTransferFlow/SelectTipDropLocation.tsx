import { useTranslation } from 'react-i18next'
import type { ComponentProps, Dispatch } from 'react'

import {
  DIRECTION_COLUMN,
  Flex,
  //   RadioButton,
  SPACING,
  //   StyledText,
  //   TYPOGRAPHY,
} from '@opentrons/components'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import type { SmallButton } from '/app/atoms/buttons'
import type {
  QuickTransferWizardState,
  QuickTransferWizardAction,
} from './types'

interface SelectTipDropLocationProps {
  onNext: () => void
  onBack: () => void
  exitButtonProps: ComponentProps<typeof SmallButton>
  state: QuickTransferWizardState
  dispatch: Dispatch<QuickTransferWizardAction>
}
export function SelectTipDropLocation({
  onNext,
  onBack,
  exitButtonProps,
  state,
  dispatch,
}: SelectTipDropLocationProps): JSX.Element {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])

  const handleClickNext = (): void => {
    // dispatch to set pipette path
    onNext()
  }

  return (
    <Flex>
      <ChildNavigation
        header={t('select_tip_drop_location')}
        buttonText={i18n.format(t('shared:continue'), 'capitalize')}
        onClickBack={onBack}
        onClickButton={handleClickNext}
        secondaryButtonProps={exitButtonProps}
        top={SPACING.spacing8}
        // if selected tip drop location is null
        // buttonIsDisabled={selectedPipette == null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing4}
      >
        {/* radio buttons */}
      </Flex>
    </Flex>
  )
}
