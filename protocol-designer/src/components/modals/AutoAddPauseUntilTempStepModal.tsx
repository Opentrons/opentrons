import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  AlertModal,
  ALIGN_FLEX_END,
  COLORS,
  DeprecatedPrimaryButton,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  Modal,
  OutlineButton,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'

import { getEnableRedesign } from '../../feature-flags/selectors'
import modalStyles from './modal.module.css'
import styles from './AutoAddPauseUntilTempStepModal.module.css'

import type { ModuleType } from '@opentrons/shared-data'

interface Props {
  displayTemperature: string
  handleCancelClick: () => unknown
  handleContinueClick: () => unknown
  moduleType: ModuleType
  displayModule?: string
}

export const AutoAddPauseUntilTempStepModal = (props: Props): JSX.Element => {
  const {
    displayTemperature,
    handleCancelClick,
    handleContinueClick,
    moduleType,
    displayModule,
  } = props
  const { t } = useTranslation('modal')
  const enableRedesign = useSelector(getEnableRedesign)
  if (enableRedesign) {
    return (
      <Modal
        title={t('auto_add_pause_until_temp_step.redesign.title', {
          module: displayModule,
          temp: displayTemperature,
        })}
        titleElement1={
          <Icon name="alert-circle" size="1.25rem" color={COLORS.yellow50} />
        }
        childrenPadding={SPACING.spacing24}
        footer={
          <Flex
            padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
            gridGap={SPACING.spacing8}
            justifyContent={ALIGN_FLEX_END}
          >
            <SecondaryButton onClick={handleCancelClick}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('auto_add_pause_until_temp_step.redesign.build_pause_later')}
              </StyledText>
            </SecondaryButton>
            <PrimaryButton onClick={handleContinueClick}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('auto_add_pause_until_temp_step.redesign.pause_protocol')}
              </StyledText>
            </PrimaryButton>
          </Flex>
        }
      >
        <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('auto_add_pause_until_temp_step.redesign.body1', {
              module: displayModule,
              temp: displayTemperature,
            })}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('auto_add_pause_until_temp_step.redesign.body2', {
              module: displayModule,
              temp: displayTemperature,
            })}
          </StyledText>
        </Flex>
      </Modal>
    )
  } else {
    return moduleType === TEMPERATURE_MODULE_TYPE ? (
      <AlertModal
        alertOverlay
        className={modalStyles.modal}
        contentsClassName={modalStyles.modal_contents}
      >
        <div className={styles.header}>
          {t('auto_add_pause_until_temp_step.title', {
            temperature: displayTemperature,
          })}
        </div>
        <p className={styles.body}>
          {t('auto_add_pause_until_temp_step.body1', {
            temperature: displayTemperature,
          })}
        </p>
        <p className={styles.body}>
          {t('auto_add_pause_until_temp_step.body2', {
            temperature: displayTemperature,
          })}
        </p>
        <div className={modalStyles.button_row}>
          <OutlineButton
            className={styles.later_button}
            onClick={handleCancelClick}
          >
            {t('auto_add_pause_until_temp_step.later_button')}
          </OutlineButton>
          <DeprecatedPrimaryButton
            className={styles.now_button}
            onClick={handleContinueClick}
          >
            {t('auto_add_pause_until_temp_step.now_button')}
          </DeprecatedPrimaryButton>
        </div>
      </AlertModal>
    ) : (
      <AlertModal
        alertOverlay
        className={modalStyles.modal}
        contentsClassName={modalStyles.modal_contents}
      >
        <div className={styles.header}>
          {t('auto_add_pause_until_temp_step.heater_shaker_title', {
            temperature: displayTemperature,
          })}
        </div>
        <p className={styles.body}>
          {t('auto_add_pause_until_temp_step.body1', {
            temperature: displayTemperature,
          })}
        </p>
        <p className={styles.body}>
          {t('auto_add_pause_until_temp_step.heater_shaker_pause_later', {
            temperature: displayTemperature,
          })}
        </p>
        <div className={modalStyles.button_row}>
          <OutlineButton
            className={styles.later_button}
            onClick={handleCancelClick}
          >
            {t('auto_add_pause_until_temp_step.later_button')}
          </OutlineButton>
          <DeprecatedPrimaryButton
            className={styles.now_button}
            onClick={handleContinueClick}
          >
            {t('auto_add_pause_until_temp_step.now_button')}
          </DeprecatedPrimaryButton>
        </div>
      </AlertModal>
    )
  }
}
