import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  COLORS,
  Flex,
  Icon,
  PrimaryButton,
  StyledText,
  Toolbox,
} from '@opentrons/components'

import { NAV_BAR_HEIGHT_REM } from '/protocol-designer/components/atoms'
import { THERMOCYCLER_PROFILE } from '/protocol-designer/constants'
import { getSubsteps } from '/protocol-designer/file-data/selectors'
import { getSavedStepForms } from '/protocol-designer/step-forms/selectors'
import { getHoveredSubstep } from '/protocol-designer/ui/steps'
import {
  hoverOnStep,
  hoverOnSubstep,
  toggleViewSubstep,
} from '/protocol-designer/ui/steps/actions/actions'

import { PipettingSubsteps } from './PipettingSubsteps'
import { ThermocyclerProfileSubsteps } from './ThermocyclerProfileSubsteps'

import type { ReactNode } from 'react'
import type { SubstepIdentifier } from '/protocol-designer/steplist'
import type { HoverOnSubstepAction } from '/protocol-designer/ui/steps'

interface SubStepsToolboxProps {
  stepId: string
}

export function SubStepsToolbox(props: SubStepsToolboxProps): ReactNode {
  const { stepId } = props
  const { t, i18n } = useTranslation([
    'application',
    'protocol_steps',
    'shared',
  ])
  const dispatch = useDispatch()
  const substeps = useSelector(getSubsteps)[stepId]
  const formData = useSelector(getSavedStepForms)[stepId]
  const hoveredSubstep = useSelector(getHoveredSubstep)
  const highlightSubstep = (payload: SubstepIdentifier): HoverOnSubstepAction =>
    dispatch(hoverOnSubstep(payload))

  if (substeps == null || formData == null) {
    return null
  }

  const handleClose = (): void => {
    dispatch(toggleViewSubstep(null))
    dispatch(hoverOnStep(null))
  }

  return ('commandCreatorFnName' in substeps &&
    (substeps.commandCreatorFnName === 'transfer' ||
      substeps.commandCreatorFnName === 'consolidate' ||
      substeps.commandCreatorFnName === 'distribute' ||
      substeps.commandCreatorFnName === 'mix')) ||
    substeps.substepType === THERMOCYCLER_PROFILE ? (
    <Toolbox
      maxHeight={`calc(100vh - ${NAV_BAR_HEIGHT_REM}rem - 1.5rem)`}
      height="100%"
      width="20.5625rem"
      closeButton={<Icon size="2rem" name="close" />}
      onCloseClick={handleClose}
      confirmButton={
        <PrimaryButton onClick={handleClose} width="100%">
          {t('shared:done')}
        </PrimaryButton>
      }
      subHeader={
        substeps.substepType === THERMOCYCLER_PROFILE ? null : (
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
            {'commandCreatorFnName' in substeps
              ? t(`protocol_steps:${substeps.commandCreatorFnName}`)
              : ''}
          </StyledText>
        )
      }
      title={
        <StyledText desktopStyle="bodyLargeSemiBold">
          {i18n.format(
            t(`protocol_steps:step_substeps`, {
              stepType: formData?.stepName ?? formData.stepType,
            }),
            'capitalize'
          )}
        </StyledText>
      }
    >
      <Flex>
        {substeps.substepType === THERMOCYCLER_PROFILE ? (
          <ThermocyclerProfileSubsteps key="substeps" stepId={stepId} />
        ) : (
          <PipettingSubsteps
            key="substeps"
            substeps={substeps}
            hoveredSubstep={hoveredSubstep}
            selectSubstep={highlightSubstep}
          />
        )}
      </Flex>
    </Toolbox>
  ) : null
}
