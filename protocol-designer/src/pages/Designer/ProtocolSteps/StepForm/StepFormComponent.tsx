import * as React from 'react'
import get from 'lodash/get'

import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { FormData, StepType } from '../../../../form-types'
import type { FieldPropsByName, FocusHandlers, StepFormProps } from './types'
import {
  MixForm,
  MoveLabwareForm,
  MoveLiquidForm,
  PauseForm,
  CommentForm,
  MagnetForm,
  TemperatureForm,
  ThermocyclerForm,
  HeaterShakerForm,
} from '../../../../components/StepEditForm/forms'
import { Alerts } from '../../../../components/alerts/Alerts'

type StepFormMap = {
  [K in StepType]?: React.ComponentType<StepFormProps> | null
}

const STEP_FORM_MAP: StepFormMap = {
  mix: MixForm,
  pause: PauseForm,
  moveLabware: MoveLabwareForm,
  moveLiquid: MoveLiquidForm,
  magnet: MagnetForm,
  temperature: TemperatureForm,
  thermocycler: ThermocyclerForm,
  heaterShaker: HeaterShakerForm,
  comment: CommentForm,
}

interface StepFormComponentProps {
  canSave: boolean
  dirtyFields: string[]
  focusHandlers: FocusHandlers
  focusedField: StepFieldName | null
  formData: FormData
  propsForFields: FieldPropsByName
  handleClose: () => void
  handleDelete: () => void
  handleSave: () => void
  showMoreOptionsModal: boolean
  toggleMoreOptionsModal: () => void
}

export const StepFormComponent = (
  props: StepFormComponentProps
): JSX.Element => {
  const {
    formData,
    focusHandlers,
    canSave,
    handleClose,
    handleDelete,
    dirtyFields,
    handleSave,
    propsForFields,
    showMoreOptionsModal,
    toggleMoreOptionsModal,
    focusedField,
  } = props

  const FormComponent: typeof STEP_FORM_MAP[keyof typeof STEP_FORM_MAP] = get(
    STEP_FORM_MAP,
    formData.stepType
  )
  if (!FormComponent) {
    // early-exit if step form doesn't exist
    return (
      <div>
        <div>Todo: support {formData && formData.stepType} step</div>
      </div>
    )
  }

  return (
    <>
      {/* {showMoreOptionsModal && (
        <MoreOptionsModal formData={formData} close={toggleMoreOptionsModal} />
      )} */}
      {/* TODO: update alerts */}
      <Alerts
        focusedField={focusedField}
        dirtyFields={dirtyFields}
        componentType="Form"
      />
      <div>
        <FormComponent {...{ formData, propsForFields, focusHandlers }} />
        {/* <ButtonRow
          handleClickMoreOptions={toggleMoreOptionsModal}
          handleClose={handleClose}
          handleSave={handleSave}
          handleDelete={handleDelete}
          canSave={canSave}
        /> */}
      </div>
    </>
  )
}
