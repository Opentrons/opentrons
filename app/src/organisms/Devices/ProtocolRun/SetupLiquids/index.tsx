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
import { ProceedToRunButton } from '../ProceedToRunButton'
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
    t('map_view')
  )
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      marginTop={SPACING.spacing4}
      gridGap={SPACING.spacing6}
    >
      {toggleGroup}
      {selectedValue === t('list_view') ? (
        <SetupLiquidsList />
      ) : (
        <SetupLiquidsMap />
      )}
      <ProceedToRunButton
        protocolRunHeaderRef={props.protocolRunHeaderRef}
        robotName={props.robotName}
        runId={props.runId}
      />
    </Flex>
  )
}
