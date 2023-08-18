import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  Box,
  Flex,
  ALIGN_CENTER,
  COLORS,
  BORDERS,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  POSITION_RELATIVE,
  ALIGN_FLEX_END,
  POSITION_ABSOLUTE,
  useOnClickOutside,
} from '@opentrons/components'
import { useMenuHandleClickOutside } from '../../atoms/MenuList/hooks'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { StyledText } from '../../atoms/text'
import { GripperWizardFlows } from '../../organisms/GripperWizardFlows'
import { formatLastCalibrated } from './CalibrationDetails/utils'
import type { GripperData } from '@opentrons/api-client'

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: ${TYPOGRAPHY.textAlignLeft};
`
const StyledTableHeader = styled.th`
  ${TYPOGRAPHY.labelSemiBold}
  padding: ${SPACING.spacing8};
`
const StyledTableRow = styled.tr`
  padding: ${SPACING.spacing8};
  border-bottom: ${BORDERS.lineBorder};
`
const StyledTableCell = styled.td`
  padding: ${SPACING.spacing8};
  text-overflow: wrap;
`

const BODY_STYLE = css`
  box-shadow: 0 0 0 1px ${COLORS.medGreyEnabled};
  border-radius: 3px;
`

export interface RobotSettingsGripperCalibrationProps {
  gripper: GripperData
}

export function RobotSettingsGripperCalibration(
  props: RobotSettingsGripperCalibrationProps
): JSX.Element {
  const { t } = useTranslation('device_settings')
  const { gripper } = props
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const calsOverflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => setShowOverflowMenu(false),
  })
  const [showWizardFlow, setShowWizardFlow] = React.useState<boolean>(false)
  const gripperCalibrationLastModified =
    gripper.data.calibratedOffset?.last_modified
  return (
    <Box paddingTop={SPACING.spacing24} paddingBottom={SPACING.spacing4}>
      <Box css={TYPOGRAPHY.h3SemiBold} marginBottom={SPACING.spacing8}>
        {t('gripper_calibration_title')}
      </Box>
      <StyledText as="p" marginBottom={SPACING.spacing8}>
        {t('gripper_calibration_description')}
      </StyledText>
      <StyledTable>
        <thead>
          <tr>
            <StyledTableHeader>{t('gripper_serial')}</StyledTableHeader>
            <StyledTableHeader>{t('last_calibrated_label')}</StyledTableHeader>
          </tr>
        </thead>
        <tbody css={BODY_STYLE}>
          <StyledTableRow>
            <StyledTableCell>
              <StyledText as="p">{gripper.serialNumber}</StyledText>
            </StyledTableCell>
            <StyledTableCell>
              <Flex alignItems={ALIGN_CENTER}>
                {gripperCalibrationLastModified != null ? (
                  <StyledText as="p">
                    {formatLastCalibrated(gripperCalibrationLastModified)}
                  </StyledText>
                ) : (
                  <StyledText as="p">{t('not_calibrated_short')}</StyledText>
                )}
              </Flex>
            </StyledTableCell>
            <StyledTableCell>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                position={POSITION_RELATIVE}
              >
                <OverflowBtn
                  alignSelf={ALIGN_FLEX_END}
                  aria-label="CalibrationOverflowMenu_button_gripperCalibration"
                  onClick={handleOverflowClick}
                />
                {showWizardFlow ? (
                  <GripperWizardFlows
                    flowType={'RECALIBRATE'}
                    attachedGripper={gripper}
                    closeFlow={() => setShowWizardFlow(false)}
                  />
                ) : null}
                {showOverflowMenu ? (
                  <Flex
                    ref={calsOverflowWrapperRef}
                    whiteSpace="nowrap"
                    zIndex={10}
                    borderRadius="4px 4px 0px 0px"
                    boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
                    position={POSITION_ABSOLUTE}
                    backgroundColor={COLORS.white}
                    top="2.3rem"
                    right={0}
                    flexDirection={DIRECTION_COLUMN}
                  >
                    <MenuItem onClick={() => setShowWizardFlow(true)}>
                      {t(
                        gripperCalibrationLastModified == null
                          ? 'calibrate_gripper'
                          : 'recalibrate_gripper'
                      )}
                    </MenuItem>
                  </Flex>
                ) : null}
                {menuOverlay}
              </Flex>
            </StyledTableCell>
          </StyledTableRow>
        </tbody>
      </StyledTable>
    </Box>
  )
}
