import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  AlertPrimaryButton,
  ALIGN_CENTER,
  Box,
  Btn,
  COLORS,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  SPACING_AUTO,
  SPACING,
  TYPOGRAPHY,
  useConditionalConfirm,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'
import { TertiaryButton } from '../../atoms/buttons'
import { ERROR_TOAST, SUCCESS_TOAST } from '../../atoms/Toast'
import { useToaster } from '../../organisms/ToasterOven'
import { LegacyModal } from '../../molecules/LegacyModal'
import { Portal } from '../../App/portal'
import {
  clearDiscoveryCache,
  getReachableRobots,
  getUnreachableRobots,
} from '../../redux/discovery'

import type { Dispatch, State } from '../../redux/types'

export function ClearUnavailableRobots(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const { makeToast } = useToaster()
  const reachableRobots = useSelector((state: State) =>
    getReachableRobots(state)
  )
  const unreachableRobots = useSelector((state: State) =>
    getUnreachableRobots(state)
  )
  const recentlySeenRobots = reachableRobots.filter(
    robot => robot.healthStatus !== 'ok'
  )
  const isUnavailableRobots =
    unreachableRobots.length > 0 || recentlySeenRobots.length > 0
  const handleDeleteUnavailRobots = (): void => {
    if (isUnavailableRobots) {
      dispatch(clearDiscoveryCache())
      makeToast(t('successfully_deleted_unavail_robots'), SUCCESS_TOAST)
    } else {
      makeToast(t('no_unavail_robots_to_clear'), ERROR_TOAST)
    }
  }
  const {
    confirm: confirmDeleteUnavailRobots,
    showConfirmation: showConfirmDeleteUnavailRobots,
    cancel: cancelExit,
  } = useConditionalConfirm(handleDeleteUnavailRobots, true)
  return (
    <>
      {showConfirmDeleteUnavailRobots ? (
        <Portal level="top">
          <LegacyModal
            type="warning"
            title={t('clear_unavailable_robots')}
            onClose={cancelExit}
          >
            <StyledText as="p">{t('clearing_cannot_be_undone')}</StyledText>
            <Flex
              flexDirection={DIRECTION_ROW}
              paddingTop={SPACING.spacing32}
              justifyContent={JUSTIFY_FLEX_END}
            >
              <Flex
                paddingRight={SPACING.spacing4}
                data-testid="AdvancedSettings_ConfirmClear_Cancel"
              >
                <Btn
                  onClick={cancelExit}
                  textTransform={TYPOGRAPHY.textTransformCapitalize}
                  color={COLORS.blue50}
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  marginRight={SPACING.spacing32}
                >
                  {t('shared:cancel')}
                </Btn>
              </Flex>
              <Flex data-testid="AdvancedSettings_ConfirmClear_Proceed">
                <AlertPrimaryButton onClick={confirmDeleteUnavailRobots}>
                  {t('clear_confirm')}
                </AlertPrimaryButton>
              </Flex>
            </Flex>
          </LegacyModal>
        </Portal>
      ) : null}
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        gridGap={SPACING.spacing40}
      >
        <Box>
          <StyledText
            css={TYPOGRAPHY.h3SemiBold}
            paddingBottom={SPACING.spacing8}
            id="AdvancedSettings_clearRobots"
          >
            {t('clear_unavail_robots')}
          </StyledText>
          <StyledText as="p">{t('clear_robots_description')}</StyledText>
        </Box>
        <TertiaryButton
          marginLeft={SPACING_AUTO}
          onClick={confirmDeleteUnavailRobots}
          id="AdvancedSettings_clearUnavailableRobots"
        >
          {t('clear_robots_button')}
        </TertiaryButton>
      </Flex>
    </>
  )
}
