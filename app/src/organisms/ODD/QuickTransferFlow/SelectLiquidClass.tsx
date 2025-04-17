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
import { useToaster } from '/app/organisms/ToasterOven'
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
    dispatch({
      type: 'SET_LIQUID_CLASS',
      liquidClass: selectedLiquidClass ?? noLiquidClass,
    })
    onNext()
  }

  // console.log(liquidClassOptions)

  const checkTipRackExist = (tipTypes: string[], target: string): boolean => {
    return tipTypes.some(item => {
      const parts = item.split('/')
      return parts.length === 3 && parts[1] === target
    })
  }

  /**
   * return true if pipette/tipRack is incompatible with liquid class
   */
  interface Compatibility {
    pipetteInCompatible?: boolean
    tipRackICompatible?: boolean
    pipettePathInCompatible?: boolean
    volumeInCompatible?: boolean
    inCompatible: boolean
  }
  const checkCompatibility = (liquid: LiquidClass): Compatibility => {
    const { liquidClassName, byPipette } = liquid
    if (liquidClassName === 'none') {
      return { inCompatible: false }
    }
    if (
      state?.pipette === undefined ||
      state?.tipRack === undefined ||
      state.path === undefined ||
      state.volume === undefined
    ) {
      return { inCompatible: true }
    }

    if (state.volume <= 10) {
      return { inCompatible: true, volumeInCompatible: true }
    }

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
    let isPathCompatible = false
    isPathCompatible = byPipette.some(pipette => {
      // Check if *any* tip type within this pipette config matches the tiprack AND the required path parameter
      return pipette.byTipType.some(tipType => {
        // Check if the tiprack load name matches
        if (tipType.tiprack === state?.tipRack?.parameters.loadName) {
          switch (state.path) {
            case 'single':
              // For 'single' path, check if 'singleDispense' property is defined
              return tipType.singleDispense !== undefined
            case 'multiDispense':
              // For 'multiDispense' path, check if 'multiDispense' property is defined
              return tipType.multiDispense !== undefined
            default:
              return true
          }
        }
      })
    })
    // if (state.path === 'multiDispense') {
    //   isPathCompatible = byPipette.some(pipette =>
    //     pipette.byTipType.some(
    //       tipType =>
    //         tipType.tiprack === state?.tipRack?.parameters.loadName &&
    //         tipType.multiDispense !== undefined
    //     )
    //   )
    // }
    return {
      pipetteInCompatible: !isPipetteCompatible,
      tipRackICompatible: !isTipRackCompatible,
      pipettePathInCompatible: !isPathCompatible,
      inCompatible:
        !isPipetteCompatible && !isTipRackCompatible && !isPathCompatible,
    }
  }

  const handleClick = (option: LiquidClass): void => {
    const {
      inCompatible,
      pipetteInCompatible,
      tipRackICompatible,
      pipettePathInCompatible,
      volumeInCompatible,
    } = checkCompatibility(option)
    if (inCompatible === true) {
      if (volumeInCompatible === true) {
        makeSnackbar(t('transfer_volumes_incompatible') as string)
      } else if (pipetteInCompatible === true) {
        makeSnackbar(t('transfer_pipette_path_incompatible') as string)
      } else if (
        pipettePathInCompatible === true ||
        tipRackICompatible === true
      ) {
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
            ariaDisabled={checkCompatibility(option).inCompatible}
          />
        ))}
      </Flex>
    </Flex>
  )
}
