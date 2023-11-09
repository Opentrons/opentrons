import * as React from 'react'
import styled from 'styled-components'
import {
  getCutoutDisplayName,
  WASTE_CHUTE_CUTOUT,
} from '@opentrons/shared-data'
import {
  OutlineButton,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  LabeledValue,
  SPACING,
  Tooltip,
  useHoverTooltip,
  Box,
  TYPOGRAPHY,
  DIRECTION_ROW,
} from '@opentrons/components'
import { i18n } from '../../localization'
import gripperImage from '../../images/flex_gripper.png'
import wasteChuteImage from '../../images/waste_chute.png'
import trashBinImage from '../../images/flex_trash_bin.png'
import { Portal } from '../portals/TopPortal'
import { TrashModal } from './TrashModal'
import { FlexSlotMap } from './FlexSlotMap'

import styles from './styles.css'

import type { Cutout } from '@opentrons/shared-data'

interface AdditionalItemsRowProps {
  handleAttachment: () => void
  isEquipmentAdded: boolean
  name: 'gripper' | 'wasteChute' | 'trashBin'
  hasWasteChute?: boolean
  trashBinSlot?: string
  trashBinId?: string
}

export function AdditionalItemsRow(
  props: AdditionalItemsRowProps
): JSX.Element {
  const {
    handleAttachment,
    isEquipmentAdded,
    name,
    trashBinSlot,
    trashBinId,
    hasWasteChute,
  } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [trashModal, openTrashModal] = React.useState<boolean>(false)
  const addTrash = name !== 'gripper' && !isEquipmentAdded
  const disabledRemoveButton =
    (name === 'trashBin' && isEquipmentAdded && !hasWasteChute) ||
    (name === 'wasteChute' && isEquipmentAdded && trashBinId == null)

  let imageSrc: string = gripperImage
  if (name === 'wasteChute') {
    imageSrc = wasteChuteImage
  } else if (name === 'trashBin') {
    imageSrc = trashBinImage
  }

  return (
    <>
      {trashModal && name !== 'gripper' ? (
        <Portal>
          <TrashModal
            onCloseClick={() => openTrashModal(false)}
            trashName={name}
            trashBinId={trashBinId}
          />
        </Portal>
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN}>
        <h4 className={styles.row_title}>
          {i18n.t(`modules.additional_equipment_display_names.${name}`)}
        </h4>

        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <AdditionalItemImage
            src={imageSrc}
            alt={i18n.t(`modules.additional_equipment_display_names.${name}`)}
          />

          <div
            className={styles.module_col}
            style={{ marginLeft: SPACING.spacing32 }}
          >
            {isEquipmentAdded && name === 'gripper' ? (
              <LabeledValue
                label="Model"
                value={i18n.t(`modules.model_display_name.gripperV1`)}
              />
            ) : null}
          </div>

          {isEquipmentAdded && name !== 'gripper' ? (
            <>
              <div className={styles.module_col}>
                <LabeledValue
                  label="Position"
                  value={`${getCutoutDisplayName(
                    (name === 'trashBin'
                      ? trashBinSlot ?? ''
                      : WASTE_CHUTE_CUTOUT) as Cutout
                  )}`}
                />
              </div>
              <div className={styles.slot_map}>
                <FlexSlotMap
                  selectedSlots={
                    name === 'trashBin'
                      ? [trashBinSlot ?? '']
                      : [WASTE_CHUTE_CUTOUT]
                  }
                />
              </div>
            </>
          ) : null}

          <Box
            flexDirection={DIRECTION_ROW}
            flex="1 0 40%"
            textAlign={TYPOGRAPHY.textAlignRight}
          >
            {name === 'trashBin' && isEquipmentAdded ? (
              <OutlineButton
                onClick={() => openTrashModal(true)}
                className={styles.module_button}
              >
                {i18n.t('shared.edit')}
              </OutlineButton>
            ) : null}
            <Box
              {...targetProps}
              width="6.75rem"
              display="inline-block"
              marginRight={SPACING.spacing16}
            >
              <OutlineButton
                className={styles.module_button}
                disabled={disabledRemoveButton}
                onClick={
                  addTrash ? () => openTrashModal(true) : handleAttachment
                }
              >
                {isEquipmentAdded
                  ? i18n.t('shared.remove')
                  : i18n.t('shared.add')}
              </OutlineButton>
            </Box>
            {disabledRemoveButton ? (
              <Tooltip
                {...tooltipProps}
                width="10rem"
                textAlign={TYPOGRAPHY.textAlignCenter}
              >
                {i18n.t(`tooltip.disabled_cannot_delete_trash`)}
              </Tooltip>
            ) : null}
          </Box>
        </Flex>
      </Flex>
    </>
  )
}

const AdditionalItemImage = styled.img`
  width: 6rem;
  max-height: 4rem;
  display: block;
`
