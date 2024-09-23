import * as React from 'react'
import get from 'lodash/get'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Flex,
  Icon,
  PrimaryButton,
  SPACING,
  StyledText,
  Toolbox,
} from '@opentrons/components'
import { stepIconsByType } from '../../../../form-types'
import {
  CommentTools,
  HeaterShakerTools,
  MagnetTools,
  MixTools,
  MoveLabwareTools,
  MoveLiquidTools,
  PauseTools,
  TemperatureTools,
  ThermocyclerTools,
} from './StepTools'
import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { FormData, StepType } from '../../../../form-types'
import type { FieldPropsByName, FocusHandlers, StepFormProps } from './types'

type StepFormMap = {
  [K in StepType]?: React.ComponentType<StepFormProps> | null
}

const STEP_FORM_MAP: StepFormMap = {
  mix: MixTools,
  pause: PauseTools,
  moveLabware: MoveLabwareTools,
  moveLiquid: MoveLiquidTools,
  magnet: MagnetTools,
  temperature: TemperatureTools,
  thermocycler: ThermocyclerTools,
  heaterShaker: HeaterShakerTools,
  comment: CommentTools,
}

interface StepFormToolboxProps {
  canSave: boolean
  dirtyFields: string[]
  focusHandlers: FocusHandlers
  focusedField: StepFieldName | null
  formData: FormData
  propsForFields: FieldPropsByName
  handleClose: () => void
  // TODO: add abiltiy to delete step?
  handleDelete: () => void
  handleSave: () => void
}

export function StepFormToolbox(props: StepFormToolboxProps): JSX.Element {
  const {
    formData,
    focusHandlers,
    canSave,
    handleClose,
    handleSave,
    propsForFields,
  } = props
  const { t, i18n } = useTranslation(['application', 'shared'])
  const icon = stepIconsByType[formData.stepType]

  const Tools: typeof STEP_FORM_MAP[keyof typeof STEP_FORM_MAP] = get(
    STEP_FORM_MAP,
    formData.stepType
  )

  if (!Tools) {
    // early-exit if step form doesn't exist, this is a good check for when new steps
    // are added
    return (
      <div>
        <div>Todo: support {formData && formData.stepType} step</div>
      </div>
    )
  }

  return (
    <>
      {/* TODO: update alerts */}
      {/* <Alerts
        focusedField={focusedField}
        dirtyFields={dirtyFields}
        componentType="Form"
      /> */}

      <Toolbox
        onCloseClick={handleClose}
        closeButtonText={t('shared:cancel')}
        confirmButton={
          <PrimaryButton onClick={handleSave} disabled={!canSave} width="100%">
            {t('shared:save')}
          </PrimaryButton>
        }
        height="calc(100vh - 64px)"
        padding="0"
        title={
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            <Icon size="1rem" name={icon} />
            <StyledText desktopStyle="bodyLargeSemiBold">
              {i18n.format(t(`stepType.${formData.stepType}`), 'capitalize')}
            </StyledText>
          </Flex>
        }
      >
        <Tools {...{ formData, propsForFields, focusHandlers }} />
      </Toolbox>
    </>
  )
}
