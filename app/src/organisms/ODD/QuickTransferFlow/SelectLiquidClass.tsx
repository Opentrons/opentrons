import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getAllLiquidClassDefs } from '@opentrons/shared-data'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useToaster } from '/app/organisms/ToasterOven'

import { ACTIONS } from './constants'
import { checkLiquidClassCompatibility } from './utils'

import type { ComponentProps, Dispatch, ReactNode } from 'react'
import type { LiquidClass, LiquidClassType } from '@opentrons/shared-data'
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
}: SelectLiquidClassProps): ReactNode {
  const { i18n, t } = useTranslation(['quick_transfer', 'shared'])
  const [selectedLiquidClass, setSelectedLiquidClass] = useState<LiquidClass>()
  const { makeSnackbar } = useToaster()

  const liquidClasses = getAllLiquidClassDefs()

  const noLiquidClass: LiquidClass = {
    byPipette: [],
    description: t('default'),
    displayName: t('do_not_use_liquid_class'),
    liquidClassName: 'none',
    namespace: 'opentrons',
    schemaVersion: 1,
  }

  const liquidClassOptions = [noLiquidClass, ...Object.values(liquidClasses)]
  const handleClickNext = (): void => {
    if (selectedLiquidClass != null) {
      dispatch({
        type: ACTIONS.SET_LIQUID_CLASS,
        liquidClassName: selectedLiquidClass.liquidClassName as LiquidClassType,
      })
    }
    onNext()
  }

  const handleClick = (option: LiquidClass): void => {
    const {
      incompatible,
      pipetteIncompatible,
      tipRackIncompatible,
      pipettePathIncompatible,
      volumeIncompatible,
    } = checkLiquidClassCompatibility(option, state)
    if (incompatible) {
      if (volumeIncompatible === true) {
        makeSnackbar(t('transfer_volumes_incompatible') as string)
      } else if (pipettePathIncompatible === true) {
        makeSnackbar(t('transfer_pipette_path_incompatible') as string)
      } else if (pipetteIncompatible === true || tipRackIncompatible === true) {
        makeSnackbar(
          t('compatibility_error', {
            pipetteOrLabware: state.pipette?.displayName,
          }) as string
        )
      }
    }
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
        buttonIsDisabled={selectedLiquidClass == null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing32} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing24}
        width="100%"
      >
        <StyledText oddStyle="level4HeaderRegular">
          {t('apply_predefined_settings')}
        </StyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          {liquidClassOptions.map(option => (
            <RadioButton
              key={option.liquidClassName}
              isSelected={
                selectedLiquidClass?.liquidClassName === option.liquidClassName
              }
              buttonLabel={option.displayName}
              buttonValue={option.liquidClassName}
              buttonSubLabel={{ label: option.description, align: 'vertical' }}
              onChange={() => {
                setSelectedLiquidClass(option)
              }}
              onClick={() => {
                handleClick(option)
              }}
              ariaDisabled={
                checkLiquidClassCompatibility(option, state).incompatible
              }
            />
          ))}
        </Flex>
      </Flex>
    </Flex>
  )
}
