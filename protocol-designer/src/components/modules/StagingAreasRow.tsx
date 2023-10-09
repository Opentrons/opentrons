import * as React from 'react'
import styled from 'styled-components'
import { WASTE_CHUTE_SLOT } from '@opentrons/shared-data'
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
import { Portal } from '../portals/TopPortal'
import { TrashModal } from './TrashModal'
import { FlexSlotMap } from './FlexSlotMap'

import styles from './styles.css'
import { AdditionalEquipmentEntity } from '@opentrons/step-generation'

interface StagingAreasRowProps {
  handleAttachment: () => void
  stagingAreas: AdditionalEquipmentEntity[]
}

export function StagingAreasRow(props: StagingAreasRowProps): JSX.Element {
  const { handleAttachment, stagingAreas } = props
  const [targetProps, tooltipProps] = useHoverTooltip()
  const [trashModal, openTrashModal] = React.useState<boolean>(false)
  //    we can assume that the location is always a string
  const stagingAreaLocations = stagingAreas.map(area => area.location as string)

  return (
    <>
      {trashModal ? (
        <Portal>
          {/* <TrashModal
            onCloseClick={() => openTrashModal(false)}
            trashName={name}
            trashBinId={trashBinId}
          /> */}
        </Portal>
      ) : null}
      <Flex flexDirection={DIRECTION_COLUMN}>
        <h4 className={styles.row_title}>
          {i18n.t(`modules.additional_equipment_display_names.stagingAreas`)}
        </h4>

        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          <AdditionalItemImage
            //  TODO(jr, 9/13/23): update this image to the waste chute and trash asset
            src={gripperImage}
            alt={i18n.t(
              `modules.additional_equipment_display_names.stagingAreas`
            )}
          />

          <div className={styles.module_col}>
            <LabeledValue
              label="Position"
              value={`Slots in ${stagingAreaLocations}`}
            />
          </div>
          <div className={styles.slot_map}>
            <FlexSlotMap selectedSlot={WASTE_CHUTE_SLOT} />
          </div>

          <Box
            flexDirection={DIRECTION_ROW}
            flex="1 0 40%"
            textAlign={TYPOGRAPHY.textAlignRight}
          >
            {stagingAreas.length > 0 ? (
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
                onClick={handleAttachment}
              >
                {stagingAreas.length > 0
                  ? i18n.t('shared.remove')
                  : i18n.t('shared.add')}
              </OutlineButton>
            </Box>
            {/* {disabledRemoveButton ? (
              <Tooltip
                {...tooltipProps}
                width="10rem"
                textAlign={TYPOGRAPHY.textAlignCenter}
              >
                {i18n.t(`tooltip.disabled_cannot_delete_trash`)}
              </Tooltip>
            ) : null} */}
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
