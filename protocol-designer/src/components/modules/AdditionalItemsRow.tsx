import * as React from 'react'
import styled from 'styled-components'
import { FLEX_ROBOT_TYPE, WASTE_CHUTE_SLOT } from '@opentrons/shared-data'
import {
  OutlineButton,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  LabeledValue,
  SPACING,
  SlotMap,
} from '@opentrons/components'
import { i18n } from '../../localization'
import gripperImage from '../../images/flex_gripper.png'
import { TrashBinModal } from './TrashBinModal'
import styles from './styles.css'

interface AdditionalItemsRowProps {
  handleAttachment: () => void
  isEquipmentAdded: boolean
  name: 'gripper' | 'wasteChute' | 'trashBin'
  trashBinSlot?: string
}

export function AdditionalItemsRow(
  props: AdditionalItemsRowProps
): JSX.Element {
  const { handleAttachment, isEquipmentAdded, name, trashBinSlot } = props
  const [modal, openModal] = React.useState<boolean>(false)
  const addTrashBin = name === 'trashBin' && !isEquipmentAdded
  return (
    <>
      {modal ? <TrashBinModal onCloseClick={() => openModal(false)} /> : null}
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        marginBottom={SPACING.spacing16}
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <h4 className={styles.row_title}>
            {i18n.t(`modules.additional_equipment_display_names.${name}`)}
          </h4>
          <AdditionalItemImage
            //  TODO(jr, 9/13/23): update this image to the waste chute asset
            src={gripperImage}
            alt={i18n.t(`modules.additional_equipment_display_names.${name}`)}
          />
        </Flex>
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
                value={`Slot ${WASTE_CHUTE_SLOT}`}
              />
            </div>
            <div className={styles.slot_map}>
              <SlotMap
                occupiedSlots={
                  name === 'trashBin' && trashBinSlot != null
                    ? [trashBinSlot]
                    : [WASTE_CHUTE_SLOT]
                }
                collisionSlots={[]}
                robotType={FLEX_ROBOT_TYPE}
              />
            </div>
          </>
        ) : null}

        <div className={styles.modules_button_group}>
          {name === 'trashBin' && isEquipmentAdded ? (
            <OutlineButton
              className={styles.module_button}
              onClick={() => openModal(true)}
            >
              {i18n.t('shared.edit')}
            </OutlineButton>
          ) : null}
          <OutlineButton
            className={styles.module_button}
            onClick={addTrashBin ? () => openModal(true) : handleAttachment}
          >
            {isEquipmentAdded ? i18n.t('shared.remove') : i18n.t('shared.add')}
          </OutlineButton>
        </div>
      </Flex>
    </>
  )
}

const AdditionalItemImage = styled.img`
  width: 6rem;
  max-height: 4rem;
  display: block;
`
