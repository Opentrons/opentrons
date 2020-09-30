All available icons:

```js
import { SIZE_3 } from '@opentrons/components'
import { ICON_DATA_BY_NAME } from './icon-data'
;<div className="icon-showcase">
  {Object.keys(ICON_DATA_BY_NAME)
    .sort()
    .map(iconName => (
      <span key={iconName}>
        <Icon name={iconName} width={SIZE_3} />
        <span>{iconName}</span>
      </span>
    ))}
</div>
```

Spin any icon!

```js
import { SIZE_3 } from '@opentrons/components'
;<div>
  <Icon width={SIZE_3} name="ot-spinner" spin />
  <Icon width={SIZE_3} name="refresh" spin />
</div>
```
