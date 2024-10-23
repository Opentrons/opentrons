import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  FLEX_MAX_CONTENT,
  Flex,
  Icon,
  PrimaryButton,
  SPACING,
  StyledText,
  Toolbox,
} from '@opentrons/components'
import { selectors as labwareIngredSelectors } from '../../../../labware-ingred/selectors'
import { getSubsteps } from '../../../../file-data/selectors'
import { getHoveredSubstep } from '../../../../ui/steps'
import {
  hoverOnStep,
  hoverOnSubstep,
  toggleViewSubstep,
} from '../../../../ui/steps/actions/actions'
import { THERMOCYCLER_PROFILE } from '../../../../constants'
import { getSavedStepForms } from '../../../../step-forms/selectors'
import { PipettingSubsteps } from './PipettingSubsteps'
import { ThermocyclerProfileSubsteps } from './ThermocyclerProfileSubsteps'
import type { SubstepIdentifier } from '../../../../steplist'
import type { HoverOnSubstepAction } from '../../../../ui/steps'

interface SubstepsToolboxProps {
  stepId: string
}

export function SubstepsToolbox(
  props: SubstepsToolboxProps
): JSX.Element | null {
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
  const ingredNames = useSelector(labwareIngredSelectors.getLiquidNamesById)
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
      width={FLEX_MAX_CONTENT}
      childrenPadding="0"
      closeButton={<Icon size="2rem" name="close" />}
      onCloseClick={handleClose}
      confirmButton={
        <PrimaryButton onClick={handleClose} width="100%">
          {t('shared:done')}
        </PrimaryButton>
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
      <Flex padding={SPACING.spacing12}>
        {substeps.substepType === THERMOCYCLER_PROFILE ? (
          <ThermocyclerProfileSubsteps key="substeps" stepId={stepId} />
        ) : (
          <PipettingSubsteps
            key="substeps"
            ingredNames={ingredNames}
            substeps={substeps}
            hoveredSubstep={hoveredSubstep}
            selectSubstep={highlightSubstep}
          />
        )}
      </Flex>
    </Toolbox>
  ) : null
}
