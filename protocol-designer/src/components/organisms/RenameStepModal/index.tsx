import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TextAreaField,
} from '@opentrons/components'

import { renameStep } from '/protocol-designer/labware-ingred/actions'
import { capitalizeFirstLetter } from '/protocol-designer/pages/Designer/ProtocolSteps/StepForm/utils'

import { getMainPagePortalEl } from '../Portal'

import type { ReactNode } from 'react'
import type { FormData } from '/protocol-designer/form-types'

const MAX_STEP_NAME_LENGTH = 60
interface RenameStepModalProps {
  formData: FormData
  onClose: () => void
}
export function RenameStepModal(props: RenameStepModalProps): ReactNode {
  const { onClose, formData } = props
  const dispatch = useDispatch()
  const { t } = useTranslation(['form', 'shared', 'protocol_steps'])
  const initialName = capitalizeFirstLetter(String(formData.stepName))
  const [stepName, setStepName] = useState<string>(initialName)
  const [stepDetails, setStepDetails] = useState<string>(
    String(formData.stepDetails)
  )

  const handleSave = (): void => {
    const { stepId } = formData
    dispatch(
      renameStep({
        stepId,
        update: {
          stepName: stepName !== '' ? stepName : initialName,
          stepDetails: stepDetails,
        },
      })
    )
    onClose()
  }

  return createPortal(
    <Modal
      title={t('shared:name_step')}
      type="info"
      closeOnOutsideClick
      onClose={onClose}
      childrenPadding={SPACING.spacing24}
      footer={
        <Flex
          justifyContent={JUSTIFY_END}
          padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
          gridGap={SPACING.spacing8}
        >
          <SecondaryButton onClick={onClose}>
            {t('shared:cancel')}
          </SecondaryButton>
          <PrimaryButton
            disabled={stepName.length >= MAX_STEP_NAME_LENGTH}
            onClick={handleSave}
          >
            {t('shared:save')}
          </PrimaryButton>
        </Flex>
      }
    >
      <form onSubmit={handleSave}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <StyledText color={COLORS.grey60} desktopStyle="captionRegular">
              {t('form:step_edit_form.field.step_name.label')}
            </StyledText>
            <InputField
              error={
                stepName.length >= MAX_STEP_NAME_LENGTH
                  ? t('protocol_steps:rename_error')
                  : null
              }
              value={stepName}
              autoFocus
              onChange={e => {
                setStepName(e.target.value)
              }}
              type="text"
              name="stepName_input"
            />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <TextAreaField
              label={t('form:step_edit_form.field.step_notes.label')}
              value={stepDetails}
              onChange={e => {
                setStepDetails(e.target.value as string)
              }}
              height="4.75rem"
            />
          </Flex>
        </Flex>
      </form>
    </Modal>,
    getMainPagePortalEl()
  )
}
