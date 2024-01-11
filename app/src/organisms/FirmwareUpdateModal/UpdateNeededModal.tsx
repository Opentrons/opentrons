import * as React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import capitalize from 'lodash/capitalize'
import { LEGACY_COLORS, DIRECTION_COLUMN, Flex, SPACING } from '@opentrons/components'
import {
  useInstrumentsQuery,
  useSubsystemUpdateQuery,
  useUpdateSubsystemMutation,
} from '@opentrons/react-api-client'
import { LEFT, RIGHT } from '@opentrons/shared-data'
import { Portal } from '../../App/portal'
import { SmallButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'
import { UpdateInProgressModal } from './UpdateInProgressModal'
import { UpdateResultsModal } from './UpdateResultsModal'
import type { Subsystem } from '@opentrons/api-client'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

interface UpdateNeededModalProps {
  onClose: () => void
  shouldExit: boolean
  subsystem: Subsystem
  setInitiatedSubsystemUpdate: (subsystem: Subsystem | null) => void
}

export function UpdateNeededModal(props: UpdateNeededModalProps): JSX.Element {
  const { onClose, shouldExit, subsystem, setInitiatedSubsystemUpdate } = props
  const { t } = useTranslation('firmware_update')
  const [updateId, setUpdateId] = React.useState<string | null>(null)
  // when we move to the next subsystem to update, set updateId back to null
  React.useEffect(() => {
    setUpdateId(null)
  }, [subsystem])

  const {
    data: instrumentsData,
    refetch: refetchInstruments,
  } = useInstrumentsQuery()
  const instrument = instrumentsData?.data.find(
    instrument => instrument.subsystem === subsystem
  )

  const { updateSubsystem } = useUpdateSubsystemMutation({
    onSuccess: data => {
      setUpdateId(data.data.id)
    },
  })

  const { data: updateData } = useSubsystemUpdateQuery(updateId)
  const status = updateData?.data.updateStatus
  const ongoingUpdateId = updateData?.data.id

  React.useEffect(() => {
    if (status === 'done') {
      setInitiatedSubsystemUpdate(null)
    }
  }, [status, setInitiatedSubsystemUpdate])

  const percentComplete = updateData?.data.updateProgress ?? 0
  const updateError = updateData?.data.updateError
  const instrumentType = subsystem === 'gripper' ? 'gripper' : 'pipette'
  let mount = ''
  if (subsystem === 'pipette_left') mount = LEFT
  else if (subsystem === 'pipette_right') mount = RIGHT

  const updateNeededHeader: ModalHeaderBaseProps = {
    title: t('update_needed'),
    iconName: 'ot-alert',
    iconColor: LEGACY_COLORS.yellow2,
  }

  let modalContent = (
    <Modal header={updateNeededHeader}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <StyledText as="p" marginBottom={SPACING.spacing60}>
          <Trans
            t={t}
            i18nKey="firmware_out_of_date"
            values={{
              mount: capitalize(mount),
              instrument: capitalize(instrumentType),
            }}
            components={{
              bold: <strong />,
            }}
          />
        </StyledText>
        <SmallButton
          onClick={() => {
            setInitiatedSubsystemUpdate(subsystem)
            updateSubsystem(subsystem)
          }}
          buttonText={t('update_firmware')}
          width="100%"
        />
      </Flex>
    </Modal>
  )
  if (
    (status === 'updating' || status === 'queued') &&
    ongoingUpdateId != null
  ) {
    modalContent = (
      <UpdateInProgressModal
        percentComplete={percentComplete}
        subsystem={subsystem}
      />
    )
  } else if (status === 'done' && ongoingUpdateId != null) {
    modalContent = (
      <UpdateResultsModal
        instrument={instrument}
        isSuccess={updateError === undefined}
        onClose={() => {
          refetchInstruments().catch(error => console.error(error))
          onClose()
        }}
        shouldExit={shouldExit}
      />
    )
  }

  return <Portal level="top">{modalContent}</Portal>
}
