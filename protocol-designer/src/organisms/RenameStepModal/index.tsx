import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  InputField,
} from '@opentrons/components'
import { i18n } from '../../assets/localization'
import { getTopPortalEl } from '../../components/portals/TopPortal'
import { ThunkDispatch } from '../../types'
import { renameStep } from '../../labware-ingred/actions'
import { RenameStepAction } from '../../file-data'
import type { FormData, StepFieldName } from '../../form-types'

interface RenameStepModalProps {
  formData: FormData
  onClose: () => void
}
export function RenameStepModal(props: RenameStepModalProps): JSX.Element {
  const { onClose, formData } = props
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const { t } = useTranslation(['form', 'shared'])
  const initialName = i18n.format(t(formData.stepName), 'capitalize')
  const [stepName, setStepName] = useState<string>(initialName)

  const makeSave = (fieldName: StepFieldName): void => {
    const { stepId } = formData
    const updatePayload: RenameStepAction = {
      stepId,
      update: {
        [fieldName]: stepName,
      },
    }
    dispatch(renameStep(updatePayload))
  }

  const handleSave = (): void => {
    dispatch(renameStep({ update: { ...formData } }))
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
            data-testid="RenameStepModal_saveButton"
            disabled={false}
            onClick={() => {
              handleSave()
            }}
          >
            {t('shared:save')}
          </PrimaryButton>
        </Flex>
      }
    >
      <form>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <StyledText color={COLORS.grey60} desktopStyle="captionRegular">
              {t('form:step_edit_form.field.step_name.label')}
            </StyledText>
            <InputField
              value={stepName}
              autoFocus
              name="StepName"
              onChange={e => {
                setStepName(e.target.value)
                makeSave('stepName')
              }}
            />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            <StyledText color={COLORS.grey60} desktopStyle="captionRegular">
              {t('form:step_edit_form.field.step_notes.label')}
            </StyledText>

            <DescriptionField />
          </Flex>
        </Flex>
      </form>
    </Modal>,
    getTopPortalEl()
  )
}

const DescriptionField = styled.textarea`
  min-height: 5rem;
  width: 100%;
  border: ${BORDERS.lineBorder};
  border-radius: ${BORDERS.borderRadius4};
  padding: ${SPACING.spacing8};
  font-size: ${TYPOGRAPHY.fontSizeH3};
  resize: none;
`
