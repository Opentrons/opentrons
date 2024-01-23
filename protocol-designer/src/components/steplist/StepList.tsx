import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { SidePanel } from '@opentrons/components'

import { END_TERMINAL_TITLE } from '../../constants'
import {
  END_TERMINAL_ITEM_ID,
  actions as steplistActions,
} from '../../steplist'
import { actions as stepsActions, getIsMultiSelectMode } from '../../ui/steps'
import { selectors as stepFormSelectors } from '../../step-forms'
import { StepCreationButton } from '../StepCreationButton'
import { DraggableStepItems } from './DraggableStepItems'
import { MultiSelectToolbar } from './MultiSelectToolbar'
import { PresavedStepItem } from './PresavedStepItem'
import { StartingDeckStateTerminalItem } from './StartingDeckStateTerminalItem'
import { TerminalItem } from './TerminalItem'

import type { StepIdType } from '../../form-types'
import type { ThunkDispatch } from '../../types'

export interface StepListProps {
  isMultiSelectMode?: boolean | null
  orderedStepIds: StepIdType[]
  reorderSelectedStep: (delta: number) => void
  reorderSteps: (steps: StepIdType[]) => void
}

export const StepList = (): JSX.Element => {
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  const isMultiSelectMode = useSelector(getIsMultiSelectMode)
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
    <SidePanel title="Protocol Timeline">
      <MultiSelectToolbar isMultiSelectMode={Boolean(isMultiSelectMode)} />

      <StartingDeckStateTerminalItem />
      <DraggableStepItems
        orderedStepIds={orderedStepIds.slice()}
        reorderSteps={(stepIds: StepIdType[]) => {
          dispatch(steplistActions.reorderSteps(stepIds))
        }}
      />
      <PresavedStepItem />
      <StepCreationButton />
      <TerminalItem id={END_TERMINAL_ITEM_ID} title={END_TERMINAL_TITLE} />
    </SidePanel>
  )
}
