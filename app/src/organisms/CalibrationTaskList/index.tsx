import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  SPACING,
} from '@opentrons/components'
import { Modal } from '../../molecules/Modal'
import { TaskList } from '../TaskList'

import { useCalibrationTaskList } from '../Devices/hooks'

import type { DashboardCalOffsetInvoker } from '../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibratePipOffset'
import type { DashboardCalTipLengthInvoker } from '../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateTipLength'
import type { DashboardCalDeckInvoker } from '../../pages/Devices/CalibrationDashboard/hooks/useDashboardCalibrateDeck'
import { StyledText } from '../../atoms/text'
import { PrimaryButton } from '../../atoms/buttons'

interface CalibrationTaskListProps {
  robotName: string
  pipOffsetCalLauncher: DashboardCalOffsetInvoker
  tipLengthCalLauncher: DashboardCalTipLengthInvoker
  deckCalLauncher: DashboardCalDeckInvoker
}

export function CalibrationTaskList({
  robotName,
  pipOffsetCalLauncher,
  tipLengthCalLauncher,
  deckCalLauncher,
}: CalibrationTaskListProps): JSX.Element {
  const prevActiveIndex = React.useRef<[number, number] | null>(null)
  const [
    showCompletionScreen,
    setShowCompletionScreen,
  ] = React.useState<boolean>(false)
  const { t } = useTranslation(['robot_calibration', 'device_settings'])
  const history = useHistory()
  const { activeIndex, taskList } = useCalibrationTaskList(
    robotName,
    pipOffsetCalLauncher,
    tipLengthCalLauncher,
    deckCalLauncher
  )

  React.useEffect(() => {
    console.log({ prevActiveIndex: prevActiveIndex.current })
    if (prevActiveIndex.current == null && activeIndex == null) {
      return
    }
    if (prevActiveIndex.current !== null && activeIndex === null) {
      setShowCompletionScreen(true)
    }
    prevActiveIndex.current = activeIndex
  }, [activeIndex])

  return (
    <Modal
      title={`${robotName} ${t('calibration_dashboard')}`}
      onClose={() =>
        history.push(`/devices/${robotName}/robot-settings/calibration`)
      }
      fullPage
      backgroundColor={COLORS.fundamentalsBackground}
      childrenPadding={`${String(SPACING.spacing4)} ${String(
        SPACING.spacing5
      )} ${String(SPACING.spacing5)} ${
        showCompletionScreen ? '' : String(SPACING.spacing2)
      }`}
    >
      {showCompletionScreen ? (
        <Flex flexDirection={DIRECTION_COLUMN} padding="4.375rem">
          <Flex
            flex="1"
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
            alignItems={ALIGN_CENTER}
          >
            <Icon
              name="ot-check"
              size="2.775rem"
              color={COLORS.successEnabled}
            />
            <StyledText as="h1" marginTop={SPACING.spacing5}>
              {t('calibrations_complete')}
            </StyledText>
            <Flex
              flex="0"
              alignSelf={ALIGN_CENTER}
              marginTop={SPACING.spacing5}
              justifyContent={JUSTIFY_FLEX_END}
            >
              <PrimaryButton
                onClick={() =>
                  history.push(
                    `/devices/${robotName}/robot-settings/calibration`
                  )
                }
              >
                {t('device_settings:done')}
              </PrimaryButton>
            </Flex>
          </Flex>
        </Flex>
      ) : (
        <TaskList activeIndex={activeIndex} taskList={taskList} />
      )}
    </Modal>
  )
}
