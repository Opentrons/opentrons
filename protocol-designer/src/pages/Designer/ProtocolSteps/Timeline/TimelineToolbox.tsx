import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  FLEX_MAX_CONTENT,
  Flex,
  SPACING,
  StyledText,
  Toolbox,
} from '@opentrons/components'
import {
  END_TERMINAL_ITEM_ID,
  START_TERMINAL_ITEM_ID,
  actions as steplistActions,
} from '../../../../steplist'
import { actions as stepsActions } from '../../../../ui/steps'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { getUnsavedForm } from '../../../../step-forms/selectors'
import { TerminalItemStep } from './TerminalItemStep'
import { AddStepButton } from './AddStepButton'
import { PresavedStep } from './PresavedStep'
import { DraggableSteps } from './DraggableSteps'

import type { StepIdType } from '../../../../form-types'
import type { ThunkDispatch } from '../../../../types'

export const TimelineToolbox = (): JSX.Element => {
  const { t } = useTranslation('protocol_steps')
  const orderedStepIds = useSelector(stepFormSelectors.getOrderedStepIds)
  const formData = useSelector(getUnsavedForm)
  //  TODO: potentially add batch edit capabilities back in
  // const isMultiSelectMode = useSelector(getIsMultiSelectMode)
  const dispatch = useDispatch<ThunkDispatch<any>>()

  const handleKeyDown: (e: KeyboardEvent) => void = e => {
    const { key, altKey: altIsPressed } = e

    if (altIsPressed) {
      let delta = 0
      if (key === 'ArrowUp') {
        delta = -1
      } else if (key === 'ArrowDown') {
        delta = 1
      }
      dispatch(stepsActions.reorderSelectedStep(delta))
    }
  }

  useEffect(() => {
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
      width={formData != null ? '8rem' : '19.5rem'}
      height={formData != null ? FLEX_MAX_CONTENT : 'calc(100vh - 78px)'}
      side="left"
      horizontalSide={formData != null ? 'top' : 'bottom'}
      title={
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('protocol_timeline')}
        </StyledText>
      }
      confirmButton={formData != null ? undefined : <AddStepButton />}
    >
      {/* todo(ja): this is for batch edit which we will need to add back in */}
      {/* <MultiSelectToolbar isMultiSelectMode={Boolean(isMultiSelectMode)} /> */}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        width="100%"
      >
        <TerminalItemStep
          id={START_TERMINAL_ITEM_ID}
          title={t('starting_deck_state')}
        />
        <DraggableSteps
          orderedStepIds={orderedStepIds}
          reorderSteps={(stepIds: StepIdType[]) => {
            dispatch(steplistActions.reorderSteps(stepIds))
          }}
        />
        <PresavedStep />
        <TerminalItemStep
          id={END_TERMINAL_ITEM_ID}
          title={t('final_deck_state')}
        />
      </Flex>
    </Toolbox>
  )
}
