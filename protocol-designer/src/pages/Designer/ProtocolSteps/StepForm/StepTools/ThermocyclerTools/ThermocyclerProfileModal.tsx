import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  EmptySelectorButton,
  Flex,
  InfoScreen,
  JUSTIFY_FLEX_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { ThermocyclerStep } from './ThermocyclerStep'

import type { FormData } from '../../../../../../form-types'
import type { FieldPropsByName } from '../../types'
import type { ThermocyclerStepType } from './ThermocyclerStep'

interface ThermocyclerModalProps {
  formData: FormData
  propsForFields: FieldPropsByName
  setShowProfileModal: React.Dispatch<React.SetStateAction<boolean>>
}

export function ThermocyclerProfileModal(
  props: ThermocyclerModalProps
): JSX.Element {
  const { formData, propsForFields, setShowProfileModal } = props
  const { i18n, t } = useTranslation(['application', 'form'])

  const [showCreateNewStep, setShowCreateNewStep] = useState<boolean>(false)
  const [showCreateNewCycle, setShowCreateNewCycle] = useState<boolean>(false)
  const [steps, setSteps] = useState<ThermocyclerStepType[]>(
    formData.orderedProfileItems.map(
      (id: string) => formData.profileItemsById[id]
    ) as ThermocyclerStepType[]
  )
  const canAddStepOrProfile = !(showCreateNewCycle || showCreateNewStep)

  const handleSaveModal = (): void => {
    propsForFields.profileItemsById.updateValue(
      steps.reduce((acc, step) => {
        return { ...acc, [step.id]: step }
      }, {})
    )
    propsForFields.orderedProfileItems.updateValue(steps.map(step => step.id))
    setShowProfileModal(false)
  }

  return (
    <Modal
      zIndexOverlay={11} // toolbox zIndex is set to 10
      title={t('form:step_edit_form.field.thermocyclerProfile.edit')}
      width="45rem"
      childrenPadding={SPACING.spacing24}
      footer={
        <Flex
          justifyContent={JUSTIFY_FLEX_END}
          gridGap={SPACING.spacing8}
          padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
        >
          <SecondaryButton
            onClick={() => {
              setShowProfileModal(false)
            }}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {i18n.format(t('cancel'), 'capitalize')}
            </StyledText>
          </SecondaryButton>
          <PrimaryButton onClick={handleSaveModal} disabled={showCreateNewStep}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {i18n.format(t('save'), 'capitalize')}
            </StyledText>
          </PrimaryButton>
        </Flex>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <Flex justifyContent={JUSTIFY_FLEX_END} gridGap={SPACING.spacing4}>
          <EmptySelectorButton
            text={t('form:step_edit_form.field.thermocyclerProfile.add_cycle')}
            onClick={() => {
              if (canAddStepOrProfile) {
                setShowCreateNewCycle(true)
              }
            }}
            textAlignment="left"
            iconName="plus"
            disabled={!canAddStepOrProfile}
          />
          <EmptySelectorButton
            text={t('form:step_edit_form.field.thermocyclerProfile.add_step')}
            onClick={() => {
              if (canAddStepOrProfile) {
                setShowCreateNewStep(true)
              }
            }}
            textAlignment="left"
            iconName="plus"
            disabled={!canAddStepOrProfile}
          />
        </Flex>
        {steps.length > 0 || showCreateNewStep || showCreateNewCycle ? (
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
            {steps.map(step => {
              return step.type === 'profileStep' ? (
                <ThermocyclerStep
                  key={step.id}
                  step={step}
                  setShowCreateNewStep={setShowCreateNewStep}
                  steps={steps}
                  setSteps={setSteps}
                />
              ) : (
                // TODO (nd: 10/1/2024): add add profile cycle component
                <>TODO: wire up cycle</>
              )
            })}
            {showCreateNewStep ? (
              <ThermocyclerStep
                setShowCreateNewStep={setShowCreateNewStep}
                steps={steps}
                setSteps={setSteps}
                readOnly={false}
              />
            ) : null}
            {showCreateNewCycle ? <>TODO: wire up cycle</> : null}
          </Flex>
        ) : (
          <InfoScreen
            content={t(
              'form:step_edit_form.field.thermocyclerProfile.no_steps'
            )}
          />
        )}
      </Flex>
    </Modal>
  )
}
