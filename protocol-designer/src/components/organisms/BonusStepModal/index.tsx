import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  Check,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'

import type { PropsWithChildren } from 'react'

interface HandleClickProps {
  handleSkipPauseClick: () => void
  handleAddPauseClick: () => void
}

type BonusStepModalProps =
  | ({
      // "We've added a ___ step for you"
      modalType:
        | 'explainWaitForTemperatureModuleTemp'
        | 'explainWaitForHeaterShakerTemp'
        | 'explainWaitForThermocyclerBlockTemp'
        | 'explainWaitForThermocyclerLidTemp'
      displayTemperature: string
    } & HandleClickProps)
  | ({
      modalType: 'explainWaitForThermocyclerProfile'
      displayTemperature?: null
    } & HandleClickProps)
  | ({
      // "Would you like to add a ___ step"
      // todo(mm, 2025-09-26): Delete this modal type when enableConcurrentModuleActions FF is deleted
      modalType: 'optionallyWaitForTemp'
      displayTemperature: string
      displayModule: string
    } & HandleClickProps)

export type BonusStepModalType = BonusStepModalProps['modalType']

/**
 * Implements the several modals that are like "you just saved a set-temperature step,
 * would you like to also add a pause step."
 */
export const BonusStepModal = (props: BonusStepModalProps): JSX.Element => {
  const { modalType, handleSkipPauseClick, handleAddPauseClick } = props
  const { t } = useTranslation()
  const [rememberDismissal, setRememberDismissal] = useState(false)

  // todo(mm, 2025-09-26): Delete this modal type when enableConcurrentModuleActions FF is deleted
  if (modalType === 'optionallyWaitForTemp') {
    const { displayModule, displayTemperature } = props
    return (
      <Modal
        marginLeft="0"
        type="warning"
        title={t('modal:auto_add_pause_until_temp_step.legacy.title', {
          module: displayModule,
          temp: displayTemperature,
        })}
        childrenPadding={SPACING.spacing24}
        footer={
          <Flex
            padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
            gridGap={SPACING.spacing8}
            justifyContent={ALIGN_FLEX_END}
          >
            <SecondaryButton onClick={handleSkipPauseClick}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t(
                  'modal:auto_add_pause_until_temp_step.legacy.skip_pause_step'
                )}
              </StyledText>
            </SecondaryButton>
            <PrimaryButton onClick={handleAddPauseClick}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t(
                  'modal:auto_add_pause_until_temp_step.legacy.add_pause_step'
                )}
              </StyledText>
            </PrimaryButton>
          </Flex>
        }
      >
        <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('modal:auto_add_pause_until_temp_step.legacy.body', {
              module: displayModule,
              temp: displayTemperature,
            })}
          </StyledText>
        </Flex>
      </Modal>
    )
  } else {
    const titleKey: string = (() => {
      switch (modalType) {
        case 'explainWaitForTemperatureModuleTemp':
          return 'modal:auto_add_pause_until_temp_step.temperature_module.title'
        case 'explainWaitForHeaterShakerTemp':
          return 'modal:auto_add_pause_until_temp_step.heater_shaker.title'
        case 'explainWaitForThermocyclerBlockTemp':
          return 'modal:auto_add_pause_until_temp_step.thermocycler_block.title'
        case 'explainWaitForThermocyclerLidTemp':
          return 'modal:auto_add_pause_until_temp_step.thermocycler_lid.title'
        case 'explainWaitForThermocyclerProfile':
          return 'modal:auto_add_pause_until_temp_step.thermocycler_profile.title'
        // default omitted, for exhaustiveness checking.
      }
    })()
    const title = t(titleKey, { temperature: props.displayTemperature })

    const bodyParagraphsKey: string = (() => {
      switch (modalType) {
        case 'explainWaitForTemperatureModuleTemp':
          return 'modal:auto_add_pause_until_temp_step.temperature_module.body'
        case 'explainWaitForHeaterShakerTemp':
          return 'modal:auto_add_pause_until_temp_step.heater_shaker.body'
        case 'explainWaitForThermocyclerBlockTemp':
          return 'modal:auto_add_pause_until_temp_step.thermocycler_block.body'
        case 'explainWaitForThermocyclerLidTemp':
          return 'modal:auto_add_pause_until_temp_step.thermocycler_lid.body'
        case 'explainWaitForThermocyclerProfile':
          return 'modal:auto_add_pause_until_temp_step.thermocycler_profile.body'
        // default omitted, for exhaustiveness checking.
      }
    })()

    const bodyParagraphs = (
      <Trans
        t={t}
        i18nKey={bodyParagraphsKey}
        values={{ temperature: props.displayTemperature }}
        components={{ p: <BodyParagraph /> }}
      />
    )

    return (
      <Modal
        marginLeft="0"
        type="warning"
        title={title}
        childrenPadding={SPACING.spacing24}
        footer={
          <Flex
            padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
            gridGap={SPACING.spacing8}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Flex
              flex="none"
              alignItems={ALIGN_CENTER}
              onClick={() => {
                setRememberDismissal(!rememberDismissal)
              }}
              gridGap={SPACING.spacing8}
            >
              {/* todo(mm, 2025-09-30): Make this checkbox actually do something. https://opentrons.atlassian.net/browse/EXEC-1925 */}
              <Check isChecked={rememberDismissal} color={COLORS.blue50} />
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.black90}
              >
                {t('alert:hint.dont_show_again')}
              </StyledText>
            </Flex>
            <PrimaryButton flex="none" onClick={handleAddPauseClick}>
              {t('shared:confirm')}
            </PrimaryButton>
          </Flex>
        }
      >
        <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
          {bodyParagraphs}
        </Flex>
      </Modal>
    )
  }
}

function BodyParagraph({ children }: PropsWithChildren): JSX.Element {
  return (
    <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.black90}>
      {children}
    </StyledText>
  )
}
