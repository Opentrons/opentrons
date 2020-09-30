ListItem example:

```js
import { TitledList } from '@opentrons/components'
;<TitledList title="List Title">
  <ListItem>Plain item</ListItem>
  <ListItem iconName="flask-outline">This item has an icon</ListItem>
  <ListItem onClick={() => alert('clicked!')}>This item is clickable</ListItem>
  <ListItem onClick={() => alert('clicked!')} isDisabled>
    This clickable item is disabled
  </ListItem>
</TitledList>
```

If the ListItem is passed a `url` prop, it will wrap its children in a `react-router-dom` `NavLink`:

```js
// <StaticRouter> used here for example purposes
import { StaticRouter } from 'react-router-dom'
import { TitledList } from '@opentrons/components'
;<StaticRouter context={{}}>
  <TitledList title="List Title Here">
    <ListItem url="#">Go somewhere</ListItem>
    <ListItem url="#" isDisabled>
      Cannot go here
    </ListItem>
  </TitledList>
</StaticRouter>
```
