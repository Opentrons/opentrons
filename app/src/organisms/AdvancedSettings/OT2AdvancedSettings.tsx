import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  Flex,
  TYPOGRAPHY,
  SPACING,
  RadioGroup,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import {
  resetUseTrashSurfaceForTipCal,
  setUseTrashSurfaceForTipCal,
} from '../../redux/calibration'
import { getUseTrashSurfaceForTipCal } from '../../redux/config'

import type { Dispatch, State } from '../../redux/types'

const ALWAYS_BLOCK: 'always-block' = 'always-block'
const ALWAYS_TRASH: 'always-trash' = 'always-trash'
const ALWAYS_PROMPT: 'always-prompt' = 'always-prompt'

type BlockSelection =
  | typeof ALWAYS_BLOCK
  | typeof ALWAYS_TRASH
  | typeof ALWAYS_PROMPT

export function OT2AdvancedSettings(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const useTrashSurfaceForTipCal = useSelector((state: State) =>
    getUseTrashSurfaceForTipCal(state)
  )

  const handleUseTrashSelection = (selection: BlockSelection): void => {
    switch (selection) {
      case ALWAYS_PROMPT:
        dispatch(resetUseTrashSurfaceForTipCal())
        break
      case ALWAYS_BLOCK:
        dispatch(setUseTrashSurfaceForTipCal(false))
        break
      case ALWAYS_TRASH:
        dispatch(setUseTrashSurfaceForTipCal(true))
        break
    }
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
      <StyledText css={TYPOGRAPHY.h3SemiBold} id="OT-2_Advanced_Settings">
        {t('ot2_advanced_settings')}
      </StyledText>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <StyledText
          css={TYPOGRAPHY.h3SemiBold}
          id="AdvancedSettings_tipLengthCalibration"
        >
          {t('tip_length_cal_method')}
        </StyledText>
        <RadioGroup
          useBlueChecked
          css={css`
            ${TYPOGRAPHY.pRegular}
            line-height: ${TYPOGRAPHY.lineHeight20};
          `}
          value={
            useTrashSurfaceForTipCal === true
              ? ALWAYS_TRASH
              : useTrashSurfaceForTipCal === false
              ? ALWAYS_BLOCK
              : ALWAYS_PROMPT
          }
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            // you know this is a limited-selection field whose values are only
            // the elements of BlockSelection; i know this is a limited-selection
            // field whose values are only the elements of BlockSelection; but sadly,
            // neither of us can get Flow to know it
            handleUseTrashSelection(event.currentTarget.value as BlockSelection)
          }}
          options={[
            { name: t('cal_block'), value: ALWAYS_BLOCK },
            { name: t('trash_bin'), value: ALWAYS_TRASH },
            { name: t('prompt'), value: ALWAYS_PROMPT },
          ]}
        />
      </Flex>
    </Flex>
  )
}
