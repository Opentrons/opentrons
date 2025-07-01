import { Trans, useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import StackerReengageLatch from 'app/assets/images/flex_stacker_reengage_latch.png'
import StackerClearObstructions from '/app/assets/videos/error-recovery/FlexStacker_ClearObstructions.webm'
import StackerEmptyHopper from '/app/assets/videos/error-recovery/FlexStacker_EmptyHopper.webm'
import StackerFillHopper from '/app/assets/videos/error-recovery/FlexStacker_FillHopper.webm'
import StackerInstallShuttle from '/app/assets/videos/error-recovery/FlexStacker_InstallShuttle.webm'
import StackerLoadLabwareOnShuttle from '/app/assets/videos/error-recovery/FlexStacker_LoadLabwareOnShuttle.webm'
import { DescriptionContent, TwoColumn } from '/app/molecules/InterventionModal'

import { ERROR_KINDS, RECOVERY_MAP } from '../constants'
import {
  HoldingLabware,
  LeftColumnLabwareInfo,
  RecoveryDoorOpenSpecial,
  RecoveryFooterButtons,
  RecoverySingleColumnContentWrapper,
  ReleaseLabware,
  RetryStepInfo,
  RightColumnAnimation,
  SkipStepInfo,
  TwoColLwInfoAndDeck,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function ManualReplaceLwAndRetry(
  props: RecoveryContentProps
): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const {
    MANUAL_REPLACE_AND_RETRY,
    STACKER_STALLED_RETRY,
    STACKER_STALLED_SKIP,
    STACKER_SHUTTLE_MISSING_RETRY,
    STACKER_HOPPER_EMPTY_RETRY,
    STACKER_HOPPER_EMPTY_SKIP,
    STACKER_SHUTTLE_EMPTY_RETRY,
    STACKER_SHUTTLE_EMPTY_SKIP,
  } = RECOVERY_MAP

  const buildUnexpectedStep = (): JSX.Element => {
    console.warn(
      `ManualReplaceLwAndRetry: ${step} in ${route} not explicitly handled. Rerouting.`
    )
    return <SelectRecoveryOption {...props} />
  }

  const buildManualReplaceLwAndRetry = (): JSX.Element => {
    switch (step) {
      case MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_HOLDING_LABWARE:
        return <HoldingLabware {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_RELEASE_LABWARE:
        return <ReleaseLabware {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.CLOSE_DOOR_GRIPPER_Z_HOME:
        return <RecoveryDoorOpenSpecial {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.MANUAL_REPLACE:
        return <TwoColLwInfoAndDeck {...props} />
      case MANUAL_REPLACE_AND_RETRY.STEPS.RETRY:
        return <RetryStepInfo {...props} />
      default:
        return buildUnexpectedStep()
    }
  }

  const buildStackerContent = (): JSX.Element => {
    switch (step) {
      case STACKER_STALLED_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_STALLED_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_SHUTTLE_MISSING_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_STALLED_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      case STACKER_STALLED_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
        return <PrepareStackerHomeStep {...props} />
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.EMPTY_STACKER:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.EMPTY_STACKER:
        return <EmptyStacker {...props} />
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.REENGAGE_LATCH:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.REENGAGE_LATCH:
        return <ReengageLatch {...props} />
      case STACKER_SHUTTLE_MISSING_RETRY.STEPS.LOAD_SHUTTLE:
        return <LoadShuttle {...props} />
      case STACKER_STALLED_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE:
      case STACKER_HOPPER_EMPTY_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE:
        return <ShuttleLabwareInfo {...props} />
      case STACKER_STALLED_RETRY.STEPS.CHECK_HOPPER:
      case STACKER_STALLED_SKIP.STEPS.CHECK_HOPPER:
      case STACKER_SHUTTLE_MISSING_RETRY.STEPS.CHECK_HOPPER:
      case STACKER_HOPPER_EMPTY_RETRY.STEPS.FILL_HOPPER:
      case STACKER_HOPPER_EMPTY_SKIP.STEPS.FILL_HOPPER:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.FILL_HOPPER:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.FILL_HOPPER:
        return <HopperLabwareInfo {...props} />
      case STACKER_STALLED_RETRY.STEPS.RETRY:
      case STACKER_SHUTTLE_MISSING_RETRY.STEPS.RETRY:
      case STACKER_HOPPER_EMPTY_RETRY.STEPS.RETRY:
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.RETRY:
        return <RetryStepInfo {...props} />
      case STACKER_STALLED_SKIP.STEPS.SKIP:
      case STACKER_HOPPER_EMPTY_SKIP.STEPS.SKIP:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.SKIP:
        return <SkipStepInfo {...props} />
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.CONFIRM_LABWARE_IN_LATCH:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_LABWARE_IN_LATCH:
        return <HoldingLabware {...props} />
      case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.RELEASE_FROM_LATCH:
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.RELEASE_FROM_LATCH:
        return <ReleaseLabware {...props} />
      default:
        return buildUnexpectedStep()
    }
  }

  const buildContent = (): JSX.Element => {
    if (route === RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE) {
      return buildManualReplaceLwAndRetry()
    }
    return buildStackerContent()
  }

  return buildContent()
}

export function PrepareStackerHomeStep(
  props: RecoveryContentProps
): JSX.Element {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions, recoveryCommands, recoveryMap } = props
  const { step } = recoveryMap
  const {
    proceedNextStep,
    goBackPrevStep,
    handleMotionRouting,
  } = routeUpdateActions
  const { homeShuttle } = recoveryCommands

  const buildTitle = (): string => {
    switch (step) {
      case RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      case RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
        return t('clear_track_of_obstructions')
      default:
        return t('prepare_track_for_homing')
    }
  }

  const getBodyText = (): string => {
    switch (step) {
      case RECOVERY_MAP.STACKER_STALLED_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      case RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
        return t('clear_track_of_obstructions_and_close_door')
      default:
        return t('carefully_clear_track')
    }
  }

  const buildBodyText = (): JSX.Element => (
    <Trans
      t={t}
      i18nKey={getBodyText()}
      components={{
        block: (
          <StyledText
            oddStyle="bodyTextRegular"
            desktopStyle="bodyDefaultRegular"
          />
        ),
      }}
    />
  )
  const primaryBtnOnClick = (): Promise<void> => {
    return handleMotionRouting(true).then(() => {
      void homeShuttle().finally(() => {
        void handleMotionRouting(false).then(() => {
          proceedNextStep()
        })
      })
    })
  }

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent headline={buildTitle()} message={buildBodyText()} />
        <RightColumnAnimation animationSrc={StackerClearObstructions} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryBtnOnClick}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}

export function EmptyStacker(props: RecoveryContentProps): JSX.Element {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions } = props
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  const buildBodyText = (): JSX.Element => (
    <Trans
      t={t}
      i18nKey="empty_stacker_of_labware_above_latch_labware_stuck"
      components={{
        block: (
          <StyledText
            oddStyle="bodyTextRegular"
            desktopStyle="bodyDefaultRegular"
          />
        ),
      }}
    />
  )

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('empty_stacker_of_labware_above_latch')}
          message={buildBodyText()}
        />
        <RightColumnAnimation animationSrc={StackerEmptyHopper} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}

export function ReengageLatch(props: RecoveryContentProps): JSX.Element {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions } = props
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('prepare_for_stacker_latch_reengage')}
          message={t('stacker_latch_will_reengage')}
        />
        <RightColumnAnimation animationSrc={StackerReengageLatch} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}

export function HopperLabwareInfo(props: RecoveryContentProps): JSX.Element {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions, failedLabwareUtils, errorKind } = props
  const { labwareQuantity } = failedLabwareUtils
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  const title =
    errorKind === ERROR_KINDS.STACKER_HOPPER_EMPTY
      ? t('load_labware_into_stacker', { quantity: labwareQuantity })
      : t('ensure_stacker_has_labware')

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <LeftColumnLabwareInfo
          {...props}
          title={title}
          type={'location'}
          layout={'stacked'}
          bannerText={t('make_sure_loaded_correct_number_of_labware_stacker')}
        />
        <RightColumnAnimation animationSrc={StackerFillHopper} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}

export function ShuttleLabwareInfo(props: RecoveryContentProps): JSX.Element {
  const { recoveryMap, recoveryCommands, routeUpdateActions } = props
  const { manualRetrieve } = recoveryCommands
  const { proceedNextStep } = routeUpdateActions

  const { t } = useTranslation('error_recovery')

  const primaryOnClick = (): void => {
    return void manualRetrieve().then(() => proceedNextStep())
  }

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <LeftColumnLabwareInfo
          {...props}
          title={t('load_labware_into_labware_shuttle')}
          type={'location'}
          layout={'stacked'}
        />
        <RightColumnAnimation animationSrc={StackerLoadLabwareOnShuttle} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryOnClick}
        secondaryBtnOnClick={props.routeUpdateActions.goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}

export function LoadShuttle(props: RecoveryContentProps): JSX.Element {
  const { t } = useTranslation('error_recovery')

  const { routeUpdateActions } = props
  const { proceedNextStep, goBackPrevStep } = routeUpdateActions

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <DescriptionContent
          headline={t('load_labware_shuttle_onto_track')}
          message={t('take_any_necessary_precautions_before_loading_shuttle')}
        />
        <RightColumnAnimation animationSrc={StackerInstallShuttle} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={proceedNextStep}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
