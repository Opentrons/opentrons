import { Trans, useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  Flex,
  InlineNotification,
  LegacyStyledText,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { DescriptionContent } from '/app/molecules/InterventionModal'
import { UnorderedList } from '/app/molecules/UnorderedList'
import {
  getFlexSlotNameOnly,
  OFFSET_KIND_DEFAULT,
  selectActivePipetteChannelCount,
  selectIsSelectedLwTipRack,
  selectLwDisplayName,
  selectSelectedLwOverview,
} from '/app/redux/protocol-runs'

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { EditOffsetContentProps } from '/app/organisms/LabwarePositionCheck/steps/HandleLabware/EditOffset'
import type { LPCWizardContentProps } from '/app/organisms/LabwarePositionCheck/types'
import type {
  LabwareStackupDetail,
  SelectedLwOverview,
} from '/app/redux/protocol-runs'
import type { State } from '/app/redux/types'

export function PlaceItemInstruction(props: EditOffsetContentProps): ReactNode {
  const { runId } = props
  const { t: commandTextT } = useTranslation('protocol_command_text')
  const { t } = useTranslation('labware_position_check')
  const { protocolData } = useSelector(
    (state: State) => state.protocolRuns[runId]?.lpc!
  )
  const isActivePipette96ch =
    useSelector(selectActivePipetteChannelCount(runId)) === 96
  const isLwTiprack = useSelector(selectIsSelectedLwTipRack(runId))
  const selectedLwInfo = useSelector(selectSelectedLwOverview(runId))!
  const offsetLocationDetails = selectedLwInfo.offsetLocationDetails!
  const isDefaultOffset = offsetLocationDetails.kind === OFFSET_KIND_DEFAULT

  const buildHeader = (): string =>
    t('prepare_item_in_location', {
      item: isLwTiprack ? t('tip_rack') : t('labware'),
      location: slotOnlyDisplayLocation,
    })

  const slotOnlyDisplayLocation = getFlexSlotNameOnly(
    offsetLocationDetails,
    protocolData,
    commandTextT as TFunction
  )

  // The "clear deck" copy handles the module case.
  const lwOnlyLocSeq = offsetLocationDetails.lwModOnlyStackupDetails.filter(
    c => c.kind === 'labware'
  ) as LabwareStackupDetail[]

  return (
    <Flex css={CONATINER_STYLE}>
      <DescriptionContent
        headline={buildHeader()}
        message={
          <UnorderedList
            items={[
              <ClearDeckCopy
                {...props}
                key="clear_deck"
                slotOnlyDisplayLocation={slotOnlyDisplayLocation}
                labwareInfo={selectedLwInfo}
              />,
              ...lwOnlyLocSeq.map((component, index) => (
                <PlaceItemInstructionContent
                  key={`${slotOnlyDisplayLocation}-${index}`}
                  isActivePipette96ch={isActivePipette96ch}
                  isDefaultOffset={isDefaultOffset}
                  isLwTiprack={isLwTiprack}
                  slotOnlyDisplayLocation={slotOnlyDisplayLocation}
                  labwareInfo={selectedLwInfo}
                  lwComponent={component}
                  isFirstItemInStackup={index === 0}
                  {...props}
                />
              )),
            ]}
          />
        }
      />
      {isActivePipette96ch && isDefaultOffset && (
        <InlineNotification
          type="alert"
          heading={
            isLwTiprack
              ? t('ensure_tip_rack_accurately_placed')
              : t('ensure_labware_accurately_placed')
          }
        />
      )}
    </Flex>
  )
}

const CONATINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  gap: ${SPACING.spacing12};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    gap: ${SPACING.spacing24};
  }
`

interface PlaceItemInstructionContentProps extends LPCWizardContentProps {
  isLwTiprack: boolean
  isDefaultOffset: boolean
  isActivePipette96ch: boolean
  slotOnlyDisplayLocation: string
  labwareInfo: SelectedLwOverview
  lwComponent: LabwareStackupDetail
  isFirstItemInStackup: boolean
}

// See LPCDeck for clarification of deck behavior.
function ClearDeckCopy({
  slotOnlyDisplayLocation,
  labwareInfo,
}: Pick<
  PlaceItemInstructionContentProps,
  'labwareInfo' | 'slotOnlyDisplayLocation'
>): ReactNode {
  const { t } = useTranslation('labware_position_check')

  const { kind: offsetKind, closestBeneathModuleModel } =
    labwareInfo.offsetLocationDetails!

  return offsetKind === OFFSET_KIND_DEFAULT ||
    closestBeneathModuleModel == null ? (
    <Trans
      t={t}
      i18nKey="clear_deck_all_lw_all_modules_from"
      tOptions={{ slot: slotOnlyDisplayLocation }}
      components={{ strong: <strong /> }}
    />
  ) : (
    <Trans t={t} i18nKey="clear_deck_all_lw_leave_modules" />
  )
}

function PlaceItemInstructionContent({
  runId,
  isLwTiprack,
  slotOnlyDisplayLocation,
  lwComponent,
  isFirstItemInStackup,
  isActivePipette96ch,
  isDefaultOffset,
}: PlaceItemInstructionContentProps): ReactNode {
  const { t } = useTranslation('labware_position_check')

  const displayName = useSelector(
    selectLwDisplayName(runId, lwComponent.labwareUri)
  )

  const buildIsLwTipRackCopy = (): string => {
    if (isActivePipette96ch && isDefaultOffset) {
      return 'place_a_full_tip_rack_in_location_96ch_default'
    } else {
      return isFirstItemInStackup
        ? 'place_a_full_tip_rack_in_location'
        : 'next_place_a_full_tip_rack_in_location'
    }
  }

  if (isLwTiprack) {
    return (
      <Trans
        t={t}
        i18nKey={buildIsLwTipRackCopy()}
        tOptions={{
          tip_rack: displayName,
          location: slotOnlyDisplayLocation,
        }}
        components={{
          bold: (
            <LegacyStyledText
              forwardedAs="span"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            />
          ),
        }}
      />
    )
  } else {
    return (
      <Trans
        t={t}
        i18nKey={
          isFirstItemInStackup
            ? 'place_labware_in_location'
            : 'next_place_labware_in_location'
        }
        tOptions={{
          labware: displayName,
          location: slotOnlyDisplayLocation,
        }}
        components={{
          bold: (
            <LegacyStyledText
              forwardedAs="span"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            />
          ),
        }}
      />
    )
  }
}
