import { SPACING, StyledText } from '@opentrons/components'

type LabwareDetailsWithCountProps = {
  title: string
  subTitle?: string
  quantity: number
}

export function LabwareDetailsWithCount({
  title,
  subTitle,
  quantity,
}: LabwareDetailsWithCountProps): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.spacing16,
        width: '100%',
      }}
    >
      <StyledText
        oddStyle="level4HeaderSemiBold"
        desktopStyle="headingSmallBold"
      >
        {title}
      </StyledText>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.spacing16,
          width: '100%',
        }}
      >
        {subTitle}
      </div>
      <StyledText desktopStyle="bodyDefaultSemiBold">{quantity}</StyledText>
    </div>
  )
}
