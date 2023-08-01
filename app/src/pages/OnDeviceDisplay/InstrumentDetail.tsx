import * as React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getGripperDisplayName,
  getPipetteModelSpecs,
  GripperModel,
  PipetteModel,
} from '@opentrons/shared-data'
import { useInstrumentsQuery } from '@opentrons/react-api-client'
import { ALIGN_CENTER, Btn, COLORS, DIRECTION_COLUMN, Flex, Icon, JUSTIFY_SPACE_BETWEEN, SPACING, TYPOGRAPHY } from '@opentrons/components'
import { BackButton } from '../../atoms/buttons/BackButton'
import { InstrumentInfo } from '../../organisms/InstrumentInfo'
import { MenuList } from '../../atoms/MenuList'
import { MenuItem } from '../../atoms/MenuList/MenuItem'
import { StyledText } from '../../atoms/text'

import type { GripperData, PipetteData } from '@opentrons/api-client'

export const InstrumentDetail = (): JSX.Element => {
  const { mount } = useParams<{ mount: PipetteData['mount'] }>()
  const { t } = useTranslation('robot_controls')
  const [showMenu, setShowMenu] = React.useState(false)
  const { data: attachedInstruments } = useInstrumentsQuery()
  const instrument =
    (attachedInstruments?.data ?? []).find(
      (i): i is PipetteData | GripperData => i.ok && i.mount === mount
    ) ?? null

  const displayName =
    instrument?.mount !== 'extension'
      ? getPipetteModelSpecs(instrument?.instrumentModel as PipetteModel)
        ?.displayName
      : getGripperDisplayName(instrument?.instrumentModel as GripperModel)

  return (
    <Flex
      padding={`${SPACING.spacing32} ${SPACING.spacing40} ${SPACING.spacing40}`}
      flexDirection={DIRECTION_COLUMN}
      height="100%"
    >
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <BackButton>{displayName}</BackButton>
        <Btn onClick={() => setShowMenu(true)}>
          <Icon
            name="overflow-btn-touchscreen"
            height="3.75rem"
            width="3rem"
            color={COLORS.darkBlack70}
          />
        </Btn>
      </Flex>
      <InstrumentInfo instrument={instrument} />
      {showMenu ? <InstrumentNavMenu /> : null}
    </Flex>
  )
}

function InstrumentNavMenu(): JSX.Element {
  return (
<MenuList
          isOnDevice={true}
          onClick={() => setShowMenu(false)}
        >
          <MenuItem onClick={() => {console.log('TODO:  implement drop tip wizard')}}>
          <Flex alignItems={ALIGN_CENTER}>
            <Icon
              name="home-gantry"
              aria-label="control-gantry_icon"
              size="2.5rem"
            />
            <StyledText
              as="h4"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginLeft={SPACING.spacing12}
            >
              {t('drop_tips')}
            </StyledText>
          </Flex>
            </MenuItem>
        </MenuList>
  )
}