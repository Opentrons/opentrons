import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { LEFT } from '../../../redux/pipettes'
import {
  Box,
  Flex,
  DIRECTION_ROW,
  ALIGN_START,
  DIRECTION_COLUMN,
  TEXT_TRANSFORM_UPPERCASE,
  SPACING,
  FONT_WEIGHT_REGULAR,
  FONT_SIZE_CAPTION,
  TYPOGRAPHY,
  COLORS,
  useOnClickOutside,
  InstrumentDiagram,
  BORDERS,
} from '@opentrons/components'
import { OverflowBtn } from '../../../atoms/MenuList/OverflowBtn'
import { StyledText } from '../../../atoms/text'
import { PipetteOverflowMenu } from './PipetteOverflowMenu'

import type { Mount } from '../../../redux/pipettes/types'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

interface PipetteCardProps {
  pipetteInfo: PipetteModelSpecs | null
  mount: Mount
  robotName: string
}

export const PipetteCard = (props: PipetteCardProps): JSX.Element => {
  const { t } = useTranslation('device_details')
  const [showOverflowMenu, setShowOverflowMenu] = React.useState(false)
  const { pipetteInfo, mount, robotName } = props
  const pipetteName = pipetteInfo?.displayName
  const pipetteOverflowWrapperRef = useOnClickOutside({
    onClickOutside: () => setShowOverflowMenu(false),
  }) as React.RefObject<HTMLDivElement>

  return (
    <Flex
      backgroundColor={COLORS.background}
      borderRadius={BORDERS.radiusSoftCorners}
      marginBottom={SPACING.spacing3}
      marginX={SPACING.spacing2}
      width={'100%'}
      data-testid={`PipetteCard_${pipetteName}`}
    >
      <Box padding={`${SPACING.spacing4} ${SPACING.spacing3}`} width="100%">
        <Flex flexDirection={DIRECTION_ROW} paddingRight={SPACING.spacing3}>
          <Flex alignItems={ALIGN_START}>
            {pipetteInfo === null ? null : (
              <InstrumentDiagram
                pipetteSpecs={pipetteInfo}
                mount={mount}
                transform="scale(0.3)"
                size="3.125rem"
                transformOrigin="20% -10%"
              />
            )}
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING.spacing3}>
            <StyledText
              textTransform={TEXT_TRANSFORM_UPPERCASE}
              color={COLORS.darkGrey}
              fontWeight={FONT_WEIGHT_REGULAR}
              fontSize={FONT_SIZE_CAPTION}
              paddingBottom={SPACING.spacing2}
              data-testid={`PipetteCard_mount_${pipetteName}`}
            >
              {t('mount', { side: mount === LEFT ? t('left') : t('right') })}
            </StyledText>
            <Flex
              paddingBottom={SPACING.spacing2}
              data-testid={`PipetteCard_display_name_${pipetteName}`}
            >
              <StyledText fontSize={TYPOGRAPHY.fontSizeP}>
                {pipetteName ?? t('empty')}
              </StyledText>
            </Flex>
          </Flex>
        </Flex>
      </Box>
      <Box
        alignSelf={ALIGN_START}
        padding={SPACING.spacing2}
        data-testid={`PipetteCard_overflow_btn_${pipetteName}`}
      >
        <OverflowBtn
          aria-label="overflow"
          onClick={() => {
            setShowOverflowMenu(prevShowOverflowMenu => !prevShowOverflowMenu)
          }}
        />
      </Box>
      {showOverflowMenu && (
        <div
          ref={pipetteOverflowWrapperRef}
          data-testid={`PipetteCard_overflow_menu_${pipetteName}`}
        >
          <PipetteOverflowMenu
            pipetteName={pipetteName ?? t('empty')}
            mount={mount}
            robotName={robotName}
          />
        </div>
      )}
    </Flex>
  )
}
