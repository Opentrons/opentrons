import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  POSITION_RELATIVE,
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
      position={POSITION_RELATIVE}
      width="19.5rem"
      title={
        <StyledText desktopStyle="bodyLargeSemiBold">
          {t('protocol_timeline')}
        </StyledText>
      }
      confirmButton={formData != null ? undefined : <AddStepButton />}
    >
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
