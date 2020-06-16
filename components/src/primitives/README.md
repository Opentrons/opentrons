Primitive components are base-level components that apply very little inherent styling (usually CSS resets) and expose simple props to customize styling or behavior at a low level.

## style props

Style props will pass their value directly into CSS, but for safety, try to use the value constants defined in `components/src/styles`.

### color

| prop name         | css property       |
| ----------------- | ------------------ |
| `color`           | `color`            |
| `backgroundColor` | `background-color` |
| `opacity`         | `opacity`          |

```js static
import { Box, C_DARK_GRAY, C_WHITE } from '@opentrons/components'

const GrayBox = () => <Box color={C_WHITE} backgroundColor={C_DARK_GRAY} />
```

### typography

| prop name       | css property     |
| --------------- | ---------------- |
| `fontSize`      | `font-size`      |
| `fontWeight`    | `font-weight`    |
| `fontStyle`     | `font-style`     |
| `lineHeight`    | `line-height`    |
| `textAlign`     | `text-align`     |
| `textTransform` | `text-transform` |

```js static
import {
  Text,
  FONT_SIZE_HEADER,
  FONT_WEIGHT_SEMIBOLD,
  LINE_HEIGHT_TITLE,
} from '@opentrons/components'

const Heading = () => (
  <Text
    fontSize={FONT_SIZE_HEADER}
    fontWeight={FONT_WEIGHT_SEMIBOLD}
    lineHeight={LINE_HEIGHT_TITLE}
  />
)
```

### spacing

| prop name       | css property                       |
| --------------- | ---------------------------------- |
| `margin`        | `margin`                           |
| `marginX`       | `margin-left` and `margin-right`   |
| `marginY`       | `margin-top` and `margin-bottom`   |
| `marginTop`     | `margin-top`                       |
| `marginRight`   | `margin-right`                     |
| `marginBottom`  | `margin-bottom`                    |
| `marginLeft`    | `margin-left`                      |
| `padding`       | `padding`                          |
| `paddingX`      | `padding-left` and `padding-right` |
| `paddingY`      | `padding-top` and `padding-bottom` |
| `paddingTop`    | `padding-top`                      |
| `paddingRight`  | `padding-right`                    |
| `paddingBottom` | `padding-bottom`                   |
| `paddingLeft`   | `padding-left`                     |

```js static
import { Box, SPACING_AUTO, SPACING_3 } from '@opentrons/components'

const Heading = () => <Box marginX={SPACING_AUTO} paddingY={SPACING_3} />
```

Note: If you specify both of a shorthand prop and the explicit prop (e.g. `marginX` and `marginLeft`), the more explicit prop will be preferred.

### borders

| prop name      | css property    |
| -------------- | --------------- |
| `border`       | `border`        |
| `borderTop`    | `border-top`    |
| `borderRight`  | `border-right`  |
| `borderBottom` | `border-bottom` |
| `borderLeft`   | `border-left`   |
| `borderRadius` | `border-radius` |

```js static
import {
  Box,
  BORDER_SOLID_LIGHT,
  BORDER_RADIUS_DEFAULT,
} from '@opentrons/components'

const Heading = () => (
  <Box border={BORDER_SOLID_LIGHT} borderRadius={BORDER_RADIUS_DEFAULT} />
)
```

### flexbox

| prop name        | css property      |
| ---------------- | ----------------- |
| `flex`           | `flex`            |
| `alignItems`     | `align-items`     |
| `justifyContent` | `justify-content` |
| `flexDirection`  | `flex-direction`  |
| `flexWrap`       | `flex-wrap`       |

```js static
import {
  Flex,
  ALIGN_ITEMS_CENTER,
  JUSTIFY_CONTENT_CENTER,
} from '@opentrons/components'

const Heading = () => (
  <Flex
    alignItems={ALIGN_ITEMS_CENTER}
    justifyContent={JUSTIFY_CONTENT_CENTER}
  />
)
```

### layout

| prop name   | css property         |
| ----------- | -------------------- |
| `display`   | `display`            |
| `size`      | `width` and `height` |
| `width`     | `width`              |
| `minWidth`  | `min-width`          |
| `maxWidth`  | `max-width`          |
| `height`    | `height`             |
| `minHeight` | `min-height`         |
| `maxHeight` | `max-height`         |
| `overflow`  | `overflow`           |
| `overflowX` | `overflow-x`         |
| `overflowY` | `overflow-y`         |

```js static
import { Box, SIZE_4, OVERFLOW_HIDDEN } from '@opentrons/components'

const Heading = () => <Box size={SIZE_4} overflow={OVERFLOW_HIDDEN} />
```

### position

| prop name  | css property |
| ---------- | ------------ |
| `position` | `position`   |
| `zIndex`   | `z-index`    |
| `top`      | `top`        |
| `right`    | `right`      |
| `bottom`   | `bottom`     |
| `left`     | `left`       |

```js static
import { Box, POSITION_ABSOLUTE } from '@opentrons/components'

const Fill = () => (
  <Box position={POSITION_ABSOLUTE} top={0} right={0} bottom={0} left={0} />
)
```

## creating custom primitives

If you find yourself in a place where...

- You need a primitive that doesn't yet exist, and
- It doesn't make sense to add that primitive to the library

...you can create your own primitive with the style props above using `styleProps` (to apply the styles based on props) and `isntStyleProp` (to ensure style props don't get passed down to the DOM):

```js static
// @flow
import styled from 'styled-components'
import { styleProps, isntStyleProp, C_DARK_GRAY } from '@opentrons/components'

import type { PrimitiveComponent } from '@opentrons/components'

export const Gray: PrimitiveComponent<HTMLDivElement> = styled.div.withConfig({
  shouldForwardProp: isntStyleProp,
})`
  color: ${C_DARK_GRAY};
  ${styleProps}
`
```
