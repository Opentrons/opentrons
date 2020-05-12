Simple Box primitive. Renders a `div` by default with various styling props for color, spacing, and typography

```js
import {
  Icon,
  C_DARK_GRAY,
  C_WHITE,
  SPACING_2,
  SPACING_3,
} from '@opentrons/components'
;<Box
  color={C_WHITE}
  backgroundColor={C_DARK_GRAY}
  paddingX={SPACING_3}
  paddingY={SPACING_2}
>
  hello world
</Box>
```

`<Box>` is a [StyledComponent](https://styled-components.com/docs/basics#getting-started), and accepts an `as` prop to render as any other DOM element or React component.

```js
<Box as="ul" paddingLeft={0}>
  <li>hello</li>
  <li>world</li>
</Box>
```
