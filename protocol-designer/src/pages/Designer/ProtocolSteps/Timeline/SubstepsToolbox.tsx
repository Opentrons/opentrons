import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import {
  Flex,
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
  const highlightSubstep = (payload: SubstepIdentifier): HoverOnSubstepAction =>
    dispatch(hoverOnSubstep(payload))

  const hoveredSubstep = useSelector(getHoveredSubstep)
  const ingredNames = useSelector(labwareIngredSelectors.getLiquidNamesById)

  if (substeps == null) {
    return null
  }

  const uiStepType = t(`application:stepType.${formData.stepType}`)

  return ('commandCreatorFnName' in substeps &&
    (substeps.commandCreatorFnName === 'transfer' ||
      substeps.commandCreatorFnName === 'consolidate' ||
      substeps.commandCreatorFnName === 'distribute' ||
      substeps.commandCreatorFnName === 'mix')) ||
    substeps.substepType === THERMOCYCLER_PROFILE ? (
    <Toolbox
      width="23.8125rem"
      childrenPadding="0"
      confirmButton={
        <PrimaryButton
          onClick={() => {
            dispatch(toggleViewSubstep(null))
            dispatch(hoverOnStep(null))
          }}
          width="100%"
        >
          {t('shared:done')}
        </PrimaryButton>
      }
      height="calc(100vh - 64px)"
      title={
        <StyledText desktopStyle="bodyLargeSemiBold">
          {i18n.format(
            t(`protocol_steps:step_substeps`, { stepType: uiStepType }),
            'capitalize'
          )}
        </StyledText>
      }
    >
      <Flex padding={SPACING.spacing12} width="100%">
        {substeps.substepType === THERMOCYCLER_PROFILE ? (
          <ThermocyclerProfileSubsteps />
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
