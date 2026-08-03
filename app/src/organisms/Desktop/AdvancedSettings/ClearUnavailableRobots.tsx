import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Box,
  Btn,
  COLORS,
  DIRECTION_ROW,
  ERROR_TOAST,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  Modal,
  PrimaryButton,
  SPACING,
  SPACING_AUTO,
  SUCCESS_TOAST,
  TYPOGRAPHY,
  useConditionalConfirm,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { TertiaryButton } from '/app/atoms/buttons'
import { useToaster } from '/app/organisms/ToasterOven'
import {
  clearDiscoveryCache,
  getReachableRobots,
  getUnreachableRobots,
} from '/app/redux/discovery'

import type { Dispatch, State } from '/app/redux/types'

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
      makeToast(
        t('successfully_deleted_unavail_robots') as string,
        SUCCESS_TOAST
      )
    } else {
      makeToast(t('no_unavail_robots_to_clear') as string, ERROR_TOAST)
    }
  }
  const {
    confirm: confirmDeleteUnavailRobots,
    showConfirmation: showConfirmDeleteUnavailRobots,
    cancel: cancelExit,
  } = useConditionalConfirm(handleDeleteUnavailRobots, true)
  return (
    <>
      {showConfirmDeleteUnavailRobots
        ? createPortal(
            <Modal
              type="warning"
              title={t('clear_unavailable_robots')}
              onClose={cancelExit}
            >
              <LegacyStyledText forwardedAs="p">
                {t('clearing_cannot_be_undone')}
              </LegacyStyledText>
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
                  <PrimaryButton
                    variant="warning"
                    onClick={confirmDeleteUnavailRobots}
                  >
                    {t('clear_confirm')}
                  </PrimaryButton>
                </Flex>
              </Flex>
            </Modal>,
            getTopPortalEl()
          )
        : null}
      <Flex
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        gridGap={SPACING.spacing40}
      >
        <Box>
          <LegacyStyledText
            css={TYPOGRAPHY.h3SemiBold}
            paddingBottom={SPACING.spacing8}
          >
            {t('clear_unavail_robots')}
          </LegacyStyledText>
          <LegacyStyledText forwardedAs="p">
            {t('clear_robots_description')}
          </LegacyStyledText>
        </Box>
        <TertiaryButton
          marginLeft={SPACING_AUTO}
          onClick={confirmDeleteUnavailRobots}
        >
          {t('clear_robots_button')}
        </TertiaryButton>
      </Flex>
    </>
  )
}
