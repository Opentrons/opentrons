import { createPortal } from 'react-dom'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  ModalHeader,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { getModalPortalEl, getTopPortalEl } from '/app/App/portal'
import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { useLPCAnalytics } from '/app/organisms/LabwarePositionCheck'
import {
  selectConflictTimestampInfo,
  sourceOffsetsFromDatabase,
  sourceOffsetsFromRun,
} from '/app/redux/protocol-runs'
import { formatTimestamp } from '/app/transformations/runs'

import type { ReactNode } from 'react'
import type { IconProps } from '@opentrons/components'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

export interface OffsetsConflictModalProps {
  runId: string
  isOnDevice: boolean
}

export function LabwareOffsetsConflictModal({
  runId,
  isOnDevice,
}: OffsetsConflictModalProps): ReactNode {
  const dispatch = useDispatch()
  const tsInfo = useSelector(selectConflictTimestampInfo(runId))
  const tsFormatted = formatTimestamp(tsInfo.timestamp ?? '')
  const { reportOffsetSourceResolution } = useLPCAnalytics({
    runId,
    robotType: FLEX_ROBOT_TYPE,
  })

  const onRunRecordOffsets = (): void => {
    dispatch(sourceOffsetsFromRun(runId))
    reportOffsetSourceResolution('fromRunRecord')
  }

  const onDatabaseOffsets = (): void => {
    dispatch(sourceOffsetsFromDatabase(runId))
    reportOffsetSourceResolution('fromDatabase')
  }

  return createPortal(
    isOnDevice ? (
      <OffsetsConflictODD
        onDatabaseOffsets={onDatabaseOffsets}
        onRunRecordOffsets={onRunRecordOffsets}
        lastFreshRunTs={tsFormatted}
      />
    ) : (
      <OffsetsConflictDesktop
        onDatabaseOffsets={onDatabaseOffsets}
        onRunRecordOffsets={onRunRecordOffsets}
        lastFreshRunTs={tsFormatted}
      />
    ),
    isOnDevice ? getTopPortalEl() : getModalPortalEl()
  )
}

interface OffsetsConflictContentProps {
  lastFreshRunTs: string | null
  onRunRecordOffsets: () => void
  onDatabaseOffsets: () => void
}

function OffsetsConflictODD({
  lastFreshRunTs,
  onDatabaseOffsets,
  onRunRecordOffsets,
}: OffsetsConflictContentProps): ReactNode {
  const { t } = useTranslation(['protocol_setup', 'branded'])

  const header: OddModalHeaderBaseProps = {
    title: t('labware_offsets_conflict'),
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }

  return (
    <OddModal header={header}>
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing32}>
        <StyledText oddStyle="bodyTextRegular">
          <Trans
            t={t}
            i18nKey="branded:labware_offsets_conflict_description"
            values={{
              timestamp: lastFreshRunTs,
            }}
            components={{
              timestamp: <strong />,
            }}
          />
        </StyledText>
        <Flex gridGap={SPACING.spacing8}>
          <SmallButton
            flex="1"
            buttonType="secondary"
            buttonText={t('use_previous_run_offsets')}
            onClick={onRunRecordOffsets}
          />
          <SmallButton
            flex="1"
            buttonText={t('use_updated_offsets')}
            onClick={onDatabaseOffsets}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}

function OffsetsConflictDesktop({
  lastFreshRunTs,
  onDatabaseOffsets,
  onRunRecordOffsets,
}: OffsetsConflictContentProps): ReactNode {
  const { t } = useTranslation(['protocol_setup', 'branded'])

  const buildIcon = (): IconProps => {
    return {
      name: 'information',
      color: COLORS.yellow50,
      size: SPACING.spacing20,
    }
  }

  const buildHeader = (): JSX.Element => {
    return (
      <ModalHeader
        title={t('labware_offsets_conflict')}
        icon={buildIcon()}
        color={COLORS.black90}
        backgroundColor={COLORS.white}
      />
    )
  }

  return (
    <ModalShell header={buildHeader()} css={DESKTOP_MODAL_STYLE}>
      <Flex css={DESKTOP_MODAL_CONTENT_CONTAINER_STYLE}>
        <StyledText desktopStyle="bodyDefaultRegular">
          <Trans
            t={t}
            i18nKey="branded:labware_offsets_conflict_description"
            values={{
              timestamp: lastFreshRunTs,
            }}
            components={{
              timestamp: <strong />,
            }}
          />
        </StyledText>
        <Flex css={DESKTOP_BUTTON_CONTAINER_STYLE}>
          <SecondaryButton onClick={onRunRecordOffsets}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('use_previous_run_offsets')}
            </StyledText>
          </SecondaryButton>
          <PrimaryButton onClick={onDatabaseOffsets}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('use_updated_offsets')}
            </StyledText>
          </PrimaryButton>
        </Flex>
      </Flex>
    </ModalShell>
  )
}

const DESKTOP_MODAL_STYLE = css`
  width: 500px;
  gap: ${SPACING.spacing16};
`

const DESKTOP_MODAL_CONTENT_CONTAINER_STYLE = css`
  padding: ${SPACING.spacing24};
  grid-gap: ${SPACING.spacing24};
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
`

const DESKTOP_BUTTON_CONTAINER_STYLE = css`
  width: 100%;
  grid-gap: ${SPACING.spacing8};
  justify-content: ${JUSTIFY_END};
`
