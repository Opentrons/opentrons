import { useNavigate } from 'react-router-dom'

import {
  ALIGN_CENTER,
  Btn,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

interface TitleHeaderProps {
  title: string
}

// Note (kj:05/12/2023) This might be a component later
export function TitleHeader({ title }: TitleHeaderProps): JSX.Element {
  const navigate = useNavigate()
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      marginBottom={SPACING.spacing40}
      position={POSITION_RELATIVE}
    >
      <Btn
        onClick={() => {
          navigate('/network-setup')
        }}
        data-testid={`${title}_header_back_button`}
      >
        <Flex
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_ROW}
          position={POSITION_ABSOLUTE}
          top="10%"
          left="0%"
        >
          <Icon name="back" size="3rem" />
        </Flex>
      </Btn>
      <LegacyStyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
        {title}
      </LegacyStyledText>
    </Flex>
  )
}
