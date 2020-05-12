Anchor link primitive. Renders an `<a>` by default with `text-decoration: none;`

```js
<Link href={'#'}>hello anchor</Link>
```

A `<Link>` can be marked as `external` to open links in a new tab (`target="_blank"`):

```js
<Link href="https://opentrons.com" external>
  hello new tab
</Link>
```

`<Link>` is a [StyledComponent](https://styled-components.com/docs/basics#getting-started), and accepts an `as` prop to render as any other DOM element or React component (e.g. `<Link>` from `react-router-dom`). It also takes all the same styling props as the `<Text>` primitive.

```js
import {
  FONT_SIZE_HEADER,
  LINE_HEIGHT_TITLE,
  FONT_WEIGHT_REGULAR,
} from '@opentrons/components'
;<Link
  as="span"
  lineHeight={LINE_HEIGHT_TITLE}
  fontSize={FONT_SIZE_HEADER}
  fontWeight={FONT_WEIGHT_REGULAR}
  onClick={() => console.log('fake link')}
>
  hello fake link
</Link>
```
