import { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  DISPLAY_NONE,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  ListButton,
  NO_WRAP,
  RadioButton,
  RESPONSIVENESS,
  SPACING,
  StyledText,
  TextListTableContent,
  truncateString,
} from '@opentrons/components'

import { LPCContentContainer } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'
import { getIsOnDevice } from '/app/redux/config'
import {
  proceedEditOffsetSubstep,
  selectAllLabwareInfoAndDefaultStatusSorted,
  selectIsNecessaryDefaultOffsetMissing,
  selectTotalOrMissingOffsetRequiredCountForLwCopy,
  setSelectedLabwareUri,
} from '/app/redux/protocol-runs'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { LPCContentContainerProps } from '/app/organisms/LabwarePositionCheck/LPCContentContainer'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'
import type { LwGeometryDetails } from '/app/redux/protocol-runs'

export function LPCLabwareList(props: LPCWizardContentProps): ReactNode {
  const { t } = useTranslation('labware_position_check')
  const isOnDevice = useSelector(getIsOnDevice)
  const dispatch = useDispatch()
  const [selectedUri, setSelectedUri] = useState('')

  const handlePrimaryOnClick = (uri: string): void => {
    dispatch(setSelectedLabwareUri(props.runId, uri))
    dispatch(proceedEditOffsetSubstep(props.runId))
  }

  const primaryButtonProps = (): Pick<
    LPCContentContainerProps,
    | 'onClickButton'
    | 'desktopFooterBtnCopy'
    | 'desktopHeaderBtnCopy'
    | 'oddHeaderBtnCopy'
  > => {
    if (isOnDevice) {
      return {
        oddHeaderBtnCopy: t('save_and_exit'),
        onClickButton: props.commandUtils.headerCommands.handleNavToDetachProbe,
        desktopHeaderBtnCopy: '',
        desktopFooterBtnCopy: '',
      }
    } else {
      return {
        desktopHeaderBtnCopy: t('save_and_exit'),
        desktopFooterBtnCopy: t('continue'),
        onClickButton: () => {
          handlePrimaryOnClick(selectedUri)
        },
        oddHeaderBtnCopy: '',
      }
    }
  }

  return (
    <LPCContentContainer
      {...props}
      header={t('labware_position_check_title')}
      {...primaryButtonProps()}
      containerStyle={isOnDevice ? undefined : DESKTOP_CONTAINER_STYLE}
      contentStyle={isOnDevice ? undefined : DESKTOP_CONTENT_CONTAINER_STYLE}
    >
      <LPCLabwareListContent
        {...props}
        selectedUri={selectedUri}
        setSelectedUri={setSelectedUri}
        handlePrimaryOnClickOdd={handlePrimaryOnClick}
      />
    </LPCContentContainer>
  )
}

const DESKTOP_CONTAINER_STYLE = css`
  height: 35.375rem;
  width: 47rem;
`

const DESKTOP_CONTENT_CONTAINER_STYLE = css`
  height: 31.625rem;
  flex-direction: ${DIRECTION_COLUMN};
  padding: ${SPACING.spacing24};
  gap: ${SPACING.spacing24};
  overflow-y: auto;

  & > *:not(:last-child) {
    flex: 1 1 auto;
    overflow-y: auto;
  }

  & > *:last-child {
    flex-shrink: 0;
  }
`

interface LPCLabwareListContentProps extends LPCWizardContentProps {
  selectedUri: string
  setSelectedUri: (uri: string) => void
  handlePrimaryOnClickOdd: (uri: string) => void
}

function LPCLabwareListContent(props: LPCLabwareListContentProps): ReactNode {
  const { t } = useTranslation('labware_position_check')
  const { runId } = props
  const labwareInfo = useSelector(
    selectAllLabwareInfoAndDefaultStatusSorted(runId)
  )
  const isOnDevice = useSelector(getIsOnDevice)

  // On the initial render, select the first uri from the list of labware (for desktop app purposes).
  useLayoutEffect(
    () => {
      if (!isOnDevice) {
        props.setSelectedUri(labwareInfo[0].uri)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <TextListTableContent header={t('select_labware_to_view_data')}>
      {/* Design uses custom headers here that are not a part of the table component */}
      {/* header styling, so we inject a custom header. */}
      <Flex css={DESKTOP_ONLY}>
        <thead css={DESKTOP_PSEUDO_HEADER_CONTAINER_STYLE}>
          <tr>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('labware_type')}
            </StyledText>
          </tr>
          <tr>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('total_offsets')}
            </StyledText>
          </tr>
        </thead>
      </Flex>
      {labwareInfo.map(({ uri, info }) => (
        <LabwareItem
          key={`labware_${uri}${Math.random()}`}
          uri={uri}
          info={info}
          {...props}
        />
      ))}
      {/* Accommodate scrolling on the ODD. */}
      <Flex css={ODD_SCROLL_BUFFER} />
    </TextListTableContent>
  )
}

interface LabwareItemProps extends LPCLabwareListContentProps {
  uri: string
  info: LwGeometryDetails
}

function LabwareItem({
  uri,
  info,
  runId,
  handlePrimaryOnClickOdd,
  setSelectedUri,
  selectedUri,
}: LabwareItemProps): ReactNode {
  const { t } = useTranslation('labware_position_check')
  const isNecessaryDefaultOffsetMissing = useSelector(
    selectIsNecessaryDefaultOffsetMissing(runId, uri)
  )
  const offsetCopy = useSelector(
    selectTotalOrMissingOffsetRequiredCountForLwCopy(runId, uri, t as TFunction)
  )
  const isOnDevice = useSelector(getIsOnDevice)

  return isOnDevice ? (
    <ListButton
      type={isNecessaryDefaultOffsetMissing ? 'notConnected' : 'noActive'}
      onClick={() => {
        handlePrimaryOnClickOdd(uri)
      }}
      width="100%"
    >
      <Flex css={CONTENT_CONTAINER_STYLE}>
        <Flex css={TEXT_CONTAINER_STYLE}>
          <LabwareInfoCopy
            displayName={info.displayName}
            version={info.version}
          />
          <StyledText oddStyle="bodyTextRegular" css={SUBTEXT_STYLE}>
            {offsetCopy}
          </StyledText>
        </Flex>
        <Icon name="chevron-right" css={ICON_STYLE} />
      </Flex>
    </ListButton>
  ) : (
    <RadioButton
      buttonLabel={
        <LabwareInfoCopy
          displayName={info.displayName}
          version={info.version}
        />
      }
      buttonValue={info.displayName}
      largeDesktopBorderRadius={true}
      buttonSubLabel={{ label: offsetCopy }}
      isSelected={selectedUri === uri}
      onChange={() => {
        setSelectedUri(uri)
      }}
    />
  )
}

function LabwareInfoCopy({
  displayName,
  version,
}: {
  displayName: LwGeometryDetails['displayName']
  version: LwGeometryDetails['version']
}): ReactNode {
  const { t } = useTranslation('labware_position_check')
  const isOnDevice = useSelector(getIsOnDevice)
  const nameString = isOnDevice ? truncateString(displayName, 40) : displayName

  return (
    <Flex css={LABWARE_COPY_CONTAINER_STYLE}>
      <StyledText
        desktopStyle="bodyDefaultSemiBold"
        oddStyle="level4HeaderSemiBold"
      >
        {nameString}
      </StyledText>
      <StyledText desktopStyle="bodyDefaultRegular" oddStyle="bodyTextRegular">
        {t('version_number', { version })}
      </StyledText>
    </Flex>
  )
}

const CONTENT_CONTAINER_STYLE = css`
  width: 100%;
  grid-gap: ${SPACING.spacing24};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
`

const LABWARE_COPY_CONTAINER_STYLE = css`
  gap: ${SPACING.spacing8};
  align-items: ${ALIGN_CENTER};
`

const TEXT_CONTAINER_STYLE = css`
  width: 100%;
  flex-grow: 1;
  gap: ${SPACING.spacing16};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  align-items: ${ALIGN_CENTER};
`

const SUBTEXT_STYLE = css`
  color: ${COLORS.grey60};
  text-wrap: ${NO_WRAP};
`

const ICON_STYLE = css`
  width: ${SPACING.spacing48};
  height: ${SPACING.spacing48};
`

const DESKTOP_ONLY = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    display: ${DISPLAY_NONE};
  }
`

const DESKTOP_PSEUDO_HEADER_CONTAINER_STYLE = css`
  color: ${COLORS.grey60};
  width: 100%;
  flex-direction: ${DIRECTION_ROW};
  display: ${DISPLAY_FLEX};
  justify-content: ${JUSTIFY_SPACE_BETWEEN};
  padding: 0 ${SPACING.spacing12};
`

const ODD_SCROLL_BUFFER = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: ${SPACING.spacing40};
  }
`
