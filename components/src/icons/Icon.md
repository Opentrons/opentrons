All available icons:

```js
import { ICON_DATA_BY_NAME } from './icon-data'
;<div className="icon-showcase">
  {Object.keys(ICON_DATA_BY_NAME)
    .sort()
    .map(iconName => (
      <span key={iconName}>
        <Icon width="64px" name={iconName} />
        <span>{iconName}</span>
      </span>
    ))}
</div>
```

Spin any icon!

```js
;<div>
  <Icon width="64px" name="ot-spinner" spin />
  <Icon width="64px" name="refresh" spin />
</div>
```
