import { useSelector } from 'react-redux'

import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import {
  getEnableLiquidClasses,
  getEnablePartialTipSupport,
  getEnableReturnTip,
} from '../../../../../../feature-flags/selectors'
import { getRobotType } from '../../../../../../file-data/selectors'
import {
  getLabwareEntities,
  getPipetteEntities,
} from '../../../../../../step-forms/selectors'
import { getFormErrorsMappedToField } from '../../utils'
import { useAssignLiquidClass } from '../MoveLiquidTools/hooks'
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
    visibleFormErrors,
    tab,
    setTab,
    setShowFormErrors,
  } = props
  const pipettes = useSelector(getPipetteEntities)
  const enableReturnTip = useSelector(getEnableReturnTip)
  const enablePartialTip = useSelector(getEnablePartialTipSupport)
  const labwares = useSelector(getLabwareEntities)
  const enableLiquidClasses = useSelector(getEnableLiquidClasses)
  const robotType = useSelector(getRobotType)

  const pickUpTipLocationValue = propsForFields.pickUpTip_location?.value
  const userSelectedPickUpTipLocation =
    pickUpTipLocationValue != null &&
    labwares[String(pickUpTipLocationValue)] != null

  const dropTipLocationValue = propsForFields.dropTip_location?.value
  const userSelectedDropTipLocation =
    dropTipLocationValue != null &&
    labwares[String(dropTipLocationValue)] != null

  const mappedErrorsToField = getFormErrorsMappedToField(visibleFormErrors)

  const orderedLiquidClassOptions = useAssignLiquidClass(
    formData,
    'labware',
    'wells',
    propsForFields.liquidClass.updateValue
  )

  const stepComponents: Record<number, () => JSX.Element> = {
    0: () => (
      <FirstStepMixTools
        propsForFields={propsForFields}
        formData={formData}
        enablePartialTip={enablePartialTip}
        pipettes={pipettes}
        mappedErrorsToField={mappedErrorsToField}
        visibleFormErrors={visibleFormErrors}
        enableReturnTip={enableReturnTip}
        userSelectedPickUpTipLocation={userSelectedPickUpTipLocation}
        userSelectedDropTipLocation={userSelectedDropTipLocation}
      />
    ),
    1: () => (
      <>
        {enableLiquidClasses && robotType === FLEX_ROBOT_TYPE ? (
          <LiquidClassesStepTools
            propsForFields={propsForFields}
            setShowFormErrors={setShowFormErrors}
            formData={formData}
            orderedLiquidClassOptions={orderedLiquidClassOptions}
            type="mix"
          />
        ) : (
          <SecondStepMixTools
            propsForFields={propsForFields}
            formData={formData}
            mappedErrorsToField={mappedErrorsToField}
            tab={tab}
            setTab={setTab}
          />
        )}
      </>
    ),

    2: () => (
      <SecondStepMixTools
        propsForFields={propsForFields}
        formData={formData}
        mappedErrorsToField={mappedErrorsToField}
        tab={tab}
        setTab={setTab}
      />
    ),
  }

  const StepComponent = stepComponents[toolboxStep] ?? stepComponents[0]
  return StepComponent()
}
