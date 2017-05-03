<template>
  <section id='increment-xyz'>
    <h3 class='title xyz'>[mm]</h3>
    <div v-for='i in increments' @click='selectIncrement(i)' :class="{'slot': i === 'Slot'}">
      <input type='radio' :id='i' name='increment' :value='i' :checked='active(i)' />
      <label :for='i'>
        {{i}}<br>
        <span></span>
      </label>
    </div>
  </section>
</template>

<script>
  export default {
    name: 'Increment',
    props: ['increments'],
    methods: {
      selectIncrement (i) {
        this.$store.dispatch('selectIncrement', {inc: i})
      },
      active (i) {
        return this.$store.state.currentIncrementPlaceable === i
      }
    }
  }
</script>
