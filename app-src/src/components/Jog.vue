<template>
  <aside id='jog'>
    <h2 class='title'>Pipette Jog</h2>
    <hr>
    <section id='jog-controls-pipette' :class="{'disabled': busy}">
      <span class='xy'>
        <h3 class='title'>[X-Y]</h3>
        <button @click="jog('y', 1)" class='btn y up'>&uarr;</button>
        <button @click="jog('x', -1)" class='btn x left'>&larr;</button>
        <button @click="jog('y', -1)" class='btn y down'>&darr;</button>
        <button @click="jog('x', 1)" class='btn x right'>&rarr;</button>
      </span>
      <span class='z'>
        <h3 class='title'>[Z]</h3>
        <button @click="jog('z', 1)" class='btn z up'>&uarr;</button>
        <button @click="jog('z', -1)" class='btn z down'>&darr;</button>
      </span>
      <span class='increment'>
        <Increment :increments='placeableIncrements'></Increment>
      </span>
    </section>

    <h2 class='title'>Plunger Jog</h2>
    <hr>
     <section id='jog-controls-plunger' :class="{'disabled': busy}">
      <span class='p'>
        <h3 class='title'>[P]</h3>
        <button @click='jog(currentAxis(), -1)'class='btn p up'>&uarr;</button>
        <button @click='jog(currentAxis(), 1)' class='btn p down'>&darr;</button>
      </span>
      <span class='increment-plunger'>
        <IncrementPlunger :increments='plungerIncrements'></IncrementPlunger>
      </span>
    </section>

    <h2 class='title'>Move to Slot</h2>
    <hr>
    <DeckSlot :busy='busy'></DeckSlot>
  </aside>
</template>

<script>
  import DeckSlot from './DeckSlot.vue'
  import Increment from './Increment.vue'
  import IncrementPlunger from './IncrementPlunger.vue'

  export default {
    name: 'Jog',
    props: ['busy'],
    data: function () {
      return {
        placeableIncrements: ['Slot', 20, 5, 1, 0.5, 0.1],
        plungerIncrements: [2, 1, 0.5, 0.1]
      }
    },
    components: {
      Increment,
      IncrementPlunger,
      DeckSlot
    },
    methods: {
      jog (axis, multiplier) {
        let increment = this.$store.state.currentIncrementPlaceable
        let incrementPlunger = this.$store.state.currentIncrementPlunger
        let coords = {}
        const slots = {'x': 91, 'y': 135, 'z': 1}
        if ('xyz'.includes(axis)) {
          if (increment === 'Slot') increment = slots[axis]
          coords[axis] = increment * multiplier
        } else if ('ab'.includes(axis)) {
          coords[axis] = incrementPlunger * multiplier
        }
        this.$store.dispatch('jog', coords)
      },
      currentAxis () {
        return this.$route.params.instrument || 'b'
      },
      handleJogEvent (e) {
        if (this.busy) return
        if (e.key === 'ArrowLeft') {
          this.jog('x', -1)
        } else if (e.key === 'ArrowRight') {
          this.jog('x', 1)
        } else if (e.key === 'ArrowDown') {
          if (e.shiftKey) return this.jog('z', -1)
          this.jog('y', -1)
        } else if (e.key === 'ArrowUp') {
          if (e.shiftKey) return this.jog('z', 1)
          this.jog('y', 1)
        }
      }
    },
    created: function () {
      window.addEventListener('keyup', this.handleJogEvent)
    }
  }
</script>
