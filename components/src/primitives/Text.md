Text primitive. Renders a `p` by default with `margin-top: 0; margin-bottom: 0;` and accepts all primitive styling props.

```js
import { FONT_SIZE_BODY_2 } from '@opentrons/components'
;<Text fontSize={FONT_SIZE_BODY_2}>hello world</Text>
```

`<Text>` is a [StyledComponent](https://styled-components.com/docs/basics#getting-started), and accepts an `as` prop to render as any other DOM element or React component.

```js
import {
  FONT_SIZE_HEADER,
  LINE_HEIGHT_TITLE,
  FONT_WEIGHT_REGULAR,
} from '@opentrons/components'
;<Text
  as="h3"
  lineHeight={LINE_HEIGHT_TITLE}
  fontSize={FONT_SIZE_HEADER}
  fontWeight={FONT_WEIGHT_REGULAR}
>
  hello h3
</Text>
```
