import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import {
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  POSITION_FIXED,
  COLORS,
} from '@opentrons/components'
import { getTopPortalEl } from '../../../App/portal'
import { LargeButton } from '../../../atoms/buttons'
import { ChildNavigation } from '../../ChildNavigation'

import type {
  ChangeTipOptions,
  QuickTransferSummaryState,
  QuickTransferSummaryAction,
} from '../types'

interface ChangeTipProps {
  onBack: () => void
  state: QuickTransferSummaryState
  dispatch: React.Dispatch<QuickTransferSummaryAction>
}

export function ChangeTip(props: ChangeTipProps): JSX.Element {
  const { onBack, state, dispatch } = props
  const { t } = useTranslation('quick_transfer')

  const allowedChangeTipOptions: ChangeTipOptions[] = ['once']
  if (state.sourceWells.length <= 96 && state.destinationWells.length <= 96) {
    allowedChangeTipOptions.push('always')
  }
  if (state.path === 'single' && state.transferType === 'distribute') {
    allowedChangeTipOptions.push('perDest')
  } else if (state.path === 'single') {
    allowedChangeTipOptions.push('perSource')
  }

  const [
    selectedChangeTipOption,
    setSelectedChangeTipOption,
  ] = React.useState<ChangeTipOptions>(state.changeTip)

  const handleClickSave = (): void => {
    if (selectedChangeTipOption !== state.changeTip) {
      dispatch({
        type: 'SET_CHANGE_TIP',
        changeTip: selectedChangeTipOption,
      })
    }
    onBack()
  }
  return createPortal(
    <Flex position={POSITION_FIXED} backgroundColor={COLORS.white} width="100%">
      <ChildNavigation
        header={t('change_tip')}
        buttonText={t('save')}
        onClickBack={onBack}
        onClickButton={handleClickSave}
        buttonIsDisabled={selectedChangeTipOption == null}
      />
      <Flex
        marginTop={SPACING.spacing120}
        flexDirection={DIRECTION_COLUMN}
        padding={`${SPACING.spacing16} ${SPACING.spacing60} ${SPACING.spacing40} ${SPACING.spacing60}`}
        gridGap={SPACING.spacing4}
        width="100%"
      >
        {allowedChangeTipOptions.map(option => (
          <LargeButton
            key={option}
            buttonType={
              selectedChangeTipOption === option ? 'primary' : 'secondary'
            }
            onClick={() => {
              setSelectedChangeTipOption(option)
            }}
            buttonText={t(`${option}`)}
          />
        ))}
      </Flex>
    </Flex>,
    getTopPortalEl()
  )
}
