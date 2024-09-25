import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { PrimaryButton, StyledText, Toolbox } from '@opentrons/components'

import { SourceDestSubstep } from '../../../../components/steplist/SourceDestSubstep'
import { SubstepIdentifier } from '../../../../steplist'
import { useDispatch, useSelector } from 'react-redux'
import { selectors as labwareIngredSelectors } from '../../../../labware-ingred/selectors'
import { getSubsteps } from '../../../../file-data/selectors'
import { HoverOnSubstepAction, getHoveredSubstep } from '../../../../ui/steps'
import {
  hoverOnSubstep,
  toggleViewSubstep,
} from '../../../../ui/steps/actions/actions'

interface SubstepsToolboxProps {
  stepId: string
}

export function SubstepsToolbox(
  props: SubstepsToolboxProps
): JSX.Element | null {
  const { stepId } = props
  const { t } = useTranslation('shared')
  const dispatch = useDispatch()
  const substeps = useSelector(getSubsteps)[stepId]
  const highlightSubstep = (payload: SubstepIdentifier): HoverOnSubstepAction =>
    dispatch(hoverOnSubstep(payload))
  const hoveredSubstep = useSelector(getHoveredSubstep)
  const ingredNames = useSelector(labwareIngredSelectors.getLiquidNamesById)

  if (substeps == null) {
    return null
  }

  return (
    <>
      <Toolbox
        childrenPadding="0"
        confirmButton={
          <PrimaryButton
            onClick={() => {
              dispatch(toggleViewSubstep(null))
            }}
            width="100%"
          >
            {t('done')}
          </PrimaryButton>
        }
        height="calc(100vh - 64px)"
        title={
          <StyledText desktopStyle="bodyLargeSemiBold">
            {substeps.substepType}
          </StyledText>
        }
      >
        {'commandCreatorFnName' in substeps &&
        (substeps.commandCreatorFnName === 'transfer' ||
          substeps.commandCreatorFnName === 'consolidate' ||
          substeps.commandCreatorFnName === 'distribute' ||
          substeps.commandCreatorFnName === 'mix') ? (
          <SourceDestSubstep
            key="substeps"
            ingredNames={ingredNames}
            substeps={substeps}
            hoveredSubstep={hoveredSubstep}
            selectSubstep={highlightSubstep}
          />
        ) : (
          <div>oops</div>
        )}
      </Toolbox>
    </>
  )
}
