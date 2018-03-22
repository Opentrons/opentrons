All available icons:

```js
const iconData = require('./icon-data').default

;<div className='icon-showcase'>
  {Object.keys(iconData).map(iconName =>
    <span key={iconName}>
      <Icon width='64px' name={iconName} />
      <span>{iconName}</span>
    </span>)}
</div>
```

Spin any icon!

```js
;<div>
  <Icon width='64px' name='ot-spinner' spin />
  <Icon width='64px' name='refresh' spin />
</div>
```
