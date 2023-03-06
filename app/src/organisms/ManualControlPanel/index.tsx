import * as React from 'react'
import {
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  SPACING,
  SIZE_4,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
} from '@opentrons/components'
import { useCreateRunMutation, useDeleteRunMutation, useStopRunMutation } from '@opentrons/react-api-client'
import { ModalShell } from '../../molecules/Modal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { RUN_STATUS_STOPPED } from '@opentrons/api-client'
import { useRunStatus } from '../RunTimeControl/hooks'
import { RobotModel } from '../../redux/discovery/types'
import { LiveControls } from './LiveControls'

interface ManualControlPanelProps {
  handleClose: () => void
  robotModel: RobotModel
}
export const ManualControlPanel = (props: ManualControlPanelProps): JSX.Element | null => {
  const { handleClose, robotModel } = props
  const [runId, setRunId] = React.useState<string | null>(null)
  const [isExiting, setIsExiting] = React.useState<boolean>(false)
  const { createRun } = useCreateRunMutation(
    { onSuccess: response => { setRunId(response.data.id) } },
  )
  React.useEffect(() => { createRun({}) }, [])

  const runStatus = useRunStatus(runId)
  const { deleteRun } = useDeleteRunMutation({
    onSuccess: () => { handleClose() }
  })
  React.useEffect(() => {
    if (runId != null && runStatus === RUN_STATUS_STOPPED) deleteRun(runId)
  }, [runStatus, runId, deleteRun])

  const { stopRun } = useStopRunMutation()

  const handleExit = (): void => {
    setIsExiting(true)
    runId != null ? stopRun(runId) : handleClose()
  }


  return (
    <ModalShell
      width="100vw"
      height="100vh"
      header={
        <WizardHeader
          title="Jog Gantry"
          onExit={isExiting ? undefined : handleExit}
        />
      }
    >
      {isExiting ? (
        <Flex height="100%" width="100%" justifyContent={JUSTIFY_CENTER} alignItems={ALIGN_CENTER} >
          <Icon name="ot-spinner" spin size={SIZE_4} />
        </Flex>
      ) : (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          padding={SPACING.spacing6}
          minHeight="25rem"
        >
          {runId != null ? (
            <LiveControls {...{runId, robotModel}} />
          ) : null}
        </Flex>
      )}
    </ModalShell>
  )
}
