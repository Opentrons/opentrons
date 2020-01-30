Basic usage:

```js
<div style={{ width: '100px' }}>
  <SlotMap occupiedSlots={['1']} />
</div>
```

Basic usage multiple occupied slots

```js
<div style={{ width: '100px' }}>
  <SlotMap occupiedSlots={['7', '8', '10', '11']} />
</div>
```

Optional collision warning notification

```js
<div style={{ width: '100px' }}>
  <SlotMap occupiedSlots={['1']} collisionSlots={['4']} />
</div>
```

Optional error styling

```js
<div style={{ width: '100px' }}>
  <SlotMap occupiedSlots={['1']} isError />
</div>
```
