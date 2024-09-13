import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, SidePanel, StyledText, Toolbox } from '@opentrons/components'

import { END_TERMINAL_TITLE } from '../../../constants'
import {
  END_TERMINAL_ITEM_ID,
  START_TERMINAL_ITEM_ID,
  actions as steplistActions,
} from '../../../steplist'
import { actions as stepsActions } from '../../../ui/steps'
import { selectors as stepFormSelectors } from '../../../step-forms'

import type { StepIdType } from '../../../form-types'
import type { ThunkDispatch } from '../../../types'
import { DraggableStepItems } from '../../../components/steplist/DraggableStepItems'
import { TerminalItemStep } from './TerminalItemStep'
import { AddStepButton } from './AddStepButton'
import { PresavedStep } from './PresavedStep'
import { StartingDeckStateTerminalItem } from '../../../components/steplist/StartingDeckStateTerminalItem'
import { PresavedStepItem } from '../../../components/steplist/PresavedStepItem'
import { StepCreationButton } from '../../../components/StepCreationButton'
import { TerminalItem } from '../../../components/steplist/TerminalItem'
import { DraggableSteps } from './DraggableSteps'

export interface StepListProps {
  isMultiSelectMode?: boolean | null
  orderedStepIds: StepIdType[]
  reorderSelectedStep: (delta: number) => void
  reorderSteps: (steps: StepIdType[]) => void
}

export const Timeline = (): JSX.Element => {
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  // const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const dispatch = useDispatch<ThunkDispatch<any>>()

  const handleKeyDown: (e: KeyboardEvent) => void = e => {
    const key = e.key
    const altIsPressed = e.altKey

    if (altIsPressed) {
      let delta = 0
      if (key === 'ArrowUp') {
        delta = -1
      } else if (key === 'ArrowDown') {
        delta = 1
      }
      if (!delta) return
      dispatch(stepsActions.reorderSelectedStep(delta))
    }
  }

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      handleKeyDown(e)
    }

    global.addEventListener('keydown', onKeyDown, false)

    return () => {
      global.removeEventListener('keydown', onKeyDown, false)
    }
  }, [])

  return (
    <Toolbox
      height="calc(100vh - 78px)"
      side="left"
      title={
        <StyledText desktopStyle="captionSemiBold">
          Protocol timeline
        </StyledText>
      }
      confirmButton={<AddStepButton />}
    >
      {/* todo(ja): this is for batch edit which we will need to add back in */}
      {/* <MultiSelectToolbar isMultiSelectMode={Boolean(isMultiSelectMode)} /> */}

      <TerminalItemStep
        id={START_TERMINAL_ITEM_ID}
        title={'Starting deck state'}
      />
      <DraggableSteps
        orderedStepIds={orderedStepIds}
        reorderSteps={(stepIds: StepIdType[]) => {
          dispatch(steplistActions.reorderSteps(stepIds))
        }}
      />
      <PresavedStep />
      <TerminalItemStep id={END_TERMINAL_ITEM_ID} title={'Final deck state'} />
    </Toolbox>
  )
}
