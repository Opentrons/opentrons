import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  JUSTIFY_CENTER,
  Flex,
  SPACING,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
} from '@opentrons/components'
import { useToggleGroup } from '../../../../molecules/ToggleGroup/useToggleGroup'
import { ANALYTICS_LIQUID_SETUP_VIEW_TOGGLE } from '../../../../redux/analytics'
import { BackToTopButton } from '../BackToTopButton'
import { SetupLiquidsList } from './SetupLiquidsList'
import { SetupLiquidsMap } from './SetupLiquidsMap'

interface SetupLiquidsProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
}

export function SetupLiquids(props: SetupLiquidsProps): JSX.Element {
  const { t } = useTranslation('protocol_setup')
  const [selectedValue, toggleGroup] = useToggleGroup(
    t('list_view'),
    t('map_view'),
    ANALYTICS_LIQUID_SETUP_VIEW_TOGGLE
  )
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      marginTop={SPACING.spacing32}
      gridGap={SPACING.spacing16}
    >
      {toggleGroup}
      {selectedValue === t('list_view') ? (
        <SetupLiquidsList runId={props.runId} />
      ) : (
        <SetupLiquidsMap runId={props.runId} robotName={props.robotName} />
      )}
      <Flex alignSelf={ALIGN_CENTER}>
        <BackToTopButton
          protocolRunHeaderRef={props.protocolRunHeaderRef}
          robotName={props.robotName}
          runId={props.runId}
          sourceLocation="SetupLiquids"
        />
      </Flex>
    </Flex>
  )
}
