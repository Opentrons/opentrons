import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useHistory } from 'react-router-dom'
import {
  Flex,
  SPACING,
  POSITION_ABSOLUTE,
  ALIGN_FLEX_END,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  COLORS,
} from '@opentrons/components'
import { useDeleteRunMutation } from '@opentrons/react-api-client'
import { Divider } from '../../atoms/structure'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { useRunControls } from '../RunTimeControl/hooks'
import type { Run } from '@opentrons/api-client'

export interface HistoricalProtocolRunOverflowMenuProps {
  runId: string
  robotName: string
  robotIsBusy: boolean
}

export function HistoricalProtocolRunOverflowMenu(
  props: HistoricalProtocolRunOverflowMenuProps
): JSX.Element {
  const { t } = useTranslation('device_details')
  const history = useHistory()

  const { runId, robotName, robotIsBusy } = props
  const [showOverflowMenu, setShowOverflowMenu] = React.useState<boolean>(false)
  const handleOverflowClick: React.MouseEventHandler<HTMLButtonElement> = e => {
    e.preventDefault()
    e.stopPropagation()
    setShowOverflowMenu(!showOverflowMenu)
  }
  const onResetSuccess = (createRunResponse: Run): void =>
    history.push(
      `/devices/${robotName}/protocol-runs/${createRunResponse.data.id}/run-log`
    )
  const { reset } = useRunControls(runId, onResetSuccess)
  const { deleteRun } = useDeleteRunMutation()

  return (
    <Flex flexDirection={DIRECTION_COLUMN} position={POSITION_RELATIVE}>
      <OverflowBtn alignSelf={ALIGN_FLEX_END} onClick={handleOverflowClick} />
      {showOverflowMenu && (
        <Flex
          width="11.625rem"
          zIndex={10}
          borderRadius={'4px 4px 0px 0px'}
          boxShadow={'0px 1px 3px rgba(0, 0, 0, 0.2)'}
          position={POSITION_ABSOLUTE}
          backgroundColor={COLORS.white}
          top={SPACING.spacing6}
          right={0}
          flexDirection={DIRECTION_COLUMN}
        >
          <NavLink to={`/devices/${robotName}/protocol-runs/${runId}/run-log`}>
            <MenuItem>{t('view_run_record')}</MenuItem>
          </NavLink>
          <MenuItem onClick={reset} disabled={robotIsBusy}>
            {t('rerun_now')}
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => deleteRun(runId)}>
            {t('delete_run')}
          </MenuItem>
        </Flex>
      )}
    </Flex>
  )
}
