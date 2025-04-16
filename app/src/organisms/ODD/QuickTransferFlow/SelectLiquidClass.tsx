import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ComponentProps, Dispatch } from 'react'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  getAllLiquidClassDefs,
  getFlexNameConversion,
} from '@opentrons/shared-data'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import type { LiquidClass } from '@opentrons/shared-data'
import type { SmallButton } from '/app/atoms/buttons'
import type {
  QuickTransferWizardState,
  QuickTransferWizardAction,
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
  const [selectedLiquidClass, setSelectedLiquidClass] = useState<any>()

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
    dispatch({ type: 'SET_LIQUID_CLASS', liquidClass: selectedLiquidClass })
    onNext()
  }

  console.log(liquidClassOptions)
  const checkTipRackExist = (tipTypes: string[], target: string): boolean => {
    return tipTypes.some(item => {
      const parts = item.split('/')
      return parts.length === 3 && parts[1] === target
    })
  }

  const checkCompatibility = (liquid: LiquidClass): boolean => {
    const { liquidClassName, byPipette } = liquid
    if (liquidClassName === 'none') return false
    if (state?.pipette === undefined || state?.tipRack === undefined)
      return true
    const pipetteModels = byPipette.map(pipette => pipette.pipetteModel)
    const tipTypes = byPipette.flatMap(pipette =>
      pipette.byTipType.map(tipType => tipType.tiprack)
    )

    const attachedPipetteModel: string = getFlexNameConversion(state?.pipette)
    const isPipetteCompatible = pipetteModels.includes(attachedPipetteModel)
    const isTipRackCompatible = checkTipRackExist(
      tipTypes,
      state.tipRack.parameters.loadName
    )

    return isPipetteCompatible && isTipRackCompatible
  }

  const handleClick = (option: LiquidClass): void => {
    if (checkCompatibility(option)) {
      console.log('handleClick')
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
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing4}
        width="100%"
      >
        <StyledText oddStyle="level4HeaderRegular">
          {t('apply_predefined_settings')}
        </StyledText>
        {/* radio buttons */}
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
              console.log('onChange')
              setSelectedLiquidClass(option)
            }}
            onClick={() => {
              handleClick(option)
            }}
            // disabled={checkCompatibility(option)}
            ariaDisabled={checkCompatibility(option)}
          />
        ))}
      </Flex>
    </Flex>
  )
}
