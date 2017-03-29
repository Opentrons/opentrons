<template>
  <section id="deck-map">
  <button  v-for="instrument in tasks" 
  class="tab" :class="{active : activePipette(instrument)}"
  @click="togglePipette(instrument.axis)"> 
  {{instrument.axis}} {{instrument.label}} <span v-for="c in instrument.channels">&#9661;</span>
  </button>
    <div class="deck-container">
     <div v-for="col in cols" class="deck-col">
        <div v-for="row in rows" class="deck-slot" :id="col+row" :class="{active : isActive(col+row), occupied: hasContainer(col+row)}">
            <container v-if="hasContainer(col+row)" :placeable="getContainer(col+row)"></container>
            <div v-else class="empty"><p>{{col+row}}</p></div>
       </div>
      </div>
    </div>
  </section>
</template>

<script>
  import Container from './Container'

  export default{
    name: 'DeckMap',
    components: {
      Container
    },
    props: ['placeable', 'instrument', 'deck'],
    data () {
      return {
        cols: ['A', 'B', 'C', 'D', 'E']
      }
    },
    computed: {
      rows () {
        let baseRows = [1, 2, 3]
        if (this.$store.state.versions.ot_version) {
          let version = this.$store.state.versions.ot_version.version
          if (version === 'hood') {
            baseRows.pop()
          }
        }
        return baseRows
      },
      activeSlot () {
        return this.$route.params.slot
      },
      tasks () {
        return this.$store.state.tasks
      }
    },
    methods: {
      hasContainer (slot) {
        let container = this.deck.find(element => element.slot === slot)
        return container != null
      },
      getContainer (slot) {
        let container = this.deck.find(element => element.slot === slot)
        return container
      },
      isActive (slot) {
        return slot === this.activeSlot
      },
      activePipette (instrument) {
        return instrument.axis === this.$route.params.instrument
      },
      togglePipette (axis) {
        let i = this.tasks.find(element => element.axis === axis)
        console.log(i.placeables[0])
        let container = i.placeables.find(element => element.slot === this.$route.params.slot) || i.placeables[0]
        // if (container === undefined) {
        //   container = i.placeables[0]
        // }

        this.$router.push({ name: 'placeable', params: {instrument: axis, slot: container.slot, placeable: container.label} })
      }
    }
  }

</script>