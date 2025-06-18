import { useSelector } from 'react-redux'

import {
  getEnablePartialTipSupport,
  getEnableReturnTip,
} from '../../../../../../feature-flags/selectors'
import {
  getLabwareEntities,
  getPipetteEntities,
} from '../../../../../../step-forms/selectors'
import {
  useAssignLiquidClass,
  useSupportedLiquidClassOptions,
} from '../MoveLiquidTools/hooks'
import { LiquidClassesStepTools } from '../MoveLiquidTools/LiquidClassesStepTools'
import { FirstStepMixTools } from './FirstStepMixTools'
import { SecondStepMixTools } from './SecondStepMixTools'

import type { StepFormProps } from '../../types'

export function MixTools(
  props: Omit<
    StepFormProps,
    'focusHandlers' | 'showFormErrors' | 'focusedField'
  >
): JSX.Element {
  const {
    propsForFields,
    formData,
    toolboxStep,
    tab,
    setTab,
    setShowFormErrors,
  } = props
  const pipettes = useSelector(getPipetteEntities)
  const enableReturnTip = useSelector(getEnableReturnTip)
  const enablePartialTip = useSelector(getEnablePartialTipSupport)
  const labwares = useSelector(getLabwareEntities)

  const pickUpTipLocationValue = propsForFields.pickUpTip_location?.value
  const userSelectedPickUpTipLocation =
    pickUpTipLocationValue != null &&
    labwares[String(pickUpTipLocationValue)] != null

  const dropTipLocationValue = propsForFields.dropTip_location?.value
  const userSelectedDropTipLocation =
    dropTipLocationValue != null &&
    labwares[String(dropTipLocationValue)] != null

  const orderedLiquidClassOptions = useAssignLiquidClass(
    formData,
    'labware',
    'wells',
    propsForFields.liquidClass.updateValue
  )

  const orderedSupportedLiquidClassOptions = useSupportedLiquidClassOptions(
    orderedLiquidClassOptions,
    formData
  )

  const stepComponents: Record<number, () => JSX.Element> = {
    0: () => (
      <FirstStepMixTools
        propsForFields={propsForFields}
        formData={formData}
        enablePartialTip={enablePartialTip}
        pipettes={pipettes}
        enableReturnTip={enableReturnTip}
        userSelectedPickUpTipLocation={userSelectedPickUpTipLocation}
        userSelectedDropTipLocation={userSelectedDropTipLocation}
      />
    ),
    1: () => (
      <>
        <LiquidClassesStepTools
          propsForFields={propsForFields}
          setShowFormErrors={setShowFormErrors}
          formData={formData}
          orderedLiquidClassOptions={orderedSupportedLiquidClassOptions}
          type="mix"
        />
      </>
    ),

    2: () => (
      <SecondStepMixTools
        propsForFields={propsForFields}
        formData={formData}
        tab={tab}
        setTab={setTab}
      />
    ),
  }

  const StepComponent = stepComponents[toolboxStep] ?? stepComponents[0]
  return StepComponent()
}
