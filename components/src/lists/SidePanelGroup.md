Basic usage:

```js
import { TitledList, ListItem } from '@opentrons/components'
;<SidePanelGroup title="Side Panel Group Title" iconName="flask-outline">
  <TitledList title="Titled List 1">
    <ListItem>Something 1</ListItem>
    <ListItem>Something 2</ListItem>
  </TitledList>

  <TitledList title="Titled List 2">
    <ListItem>Something 1</ListItem>
    <ListItem>Something 2</ListItem>
  </TitledList>
</SidePanelGroup>
```

The entire SidePanelGroup may be disabled with the `disabled` prop. Pointer events will be disabled and all children will be lightened.

```js
import { TitledList, ListItem } from '@opentrons/components'
;<SidePanelGroup
  title="Disabled Side Panel Group Title"
  iconName="flask-outline"
  disabled
>
  <TitledList title="Titled List 1">
    <ListItem>Something 1</ListItem>
    <ListItem>Something 2</ListItem>
  </TitledList>

  <TitledList title="Titled List 2">
    <ListItem>Something 1</ListItem>
    <ListItem>Something 2</ListItem>
  </TitledList>
</SidePanelGroup>
```
