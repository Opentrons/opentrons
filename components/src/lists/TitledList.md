Basic usage:

```js
import { ListItem } from '@opentrons/components'
;<TitledList title="Titled List With Icon" iconName="flask-outline">
  <ListItem>Something 1</ListItem>
  <ListItem>Something 2</ListItem>
</TitledList>
```

Using the onClick and selected props:

```js
import { ListItem } from '@opentrons/components'
const [state, setState] = React.useState({ selected: false })
;<TitledList
  title="Selectable Titled List"
  onClick={() => setState({ selected: !state.selected })}
  selected={state.selected}
>
  <ListItem>Something 1</ListItem>
  <ListItem>Something 2</ListItem>
</TitledList>
```

If `onCollapseToggle` prop is given a function, the TitledList will be collapsible, dictated by the `collapsed` prop. `onCollapseToggle` will only fire on caret clicks, not title clicks:

```js
import { ListItem } from '@opentrons/components'
const [state, setState] = React.useState({ selected: false, collapsed: false })
;<TitledList
  title="Collapsible Titled List"
  onClick={() => setState({ selected: !state.selected })}
  onCollapseToggle={() => setState({ collapsed: !state.collapsed })}
  selected={state.selected}
  collapsed={state.collapsed}
>
  <ListItem>Something 1</ListItem>
  <ListItem>Something 2</ListItem>
</TitledList>
```

The entire TitledList may be disabled with the `disabled` prop. The `selected` prop will be ignored while the `collapsed` prop will be respected. `onClick` and `onCollapseToggle` will not fire:

import { ListItem } from '@opentrons/components'

```js
import { ListItem } from '@opentrons/components'
;<TitledList
  title="Disabled Titled List"
  onClick={() => alert("this won't happen")}
  onCollapseToggle={() => alert("this won't happen")}
  selected
  disabled
>
  <ListItem>Something 1</ListItem>
  <ListItem>Something 2</ListItem>
</TitledList>
```
