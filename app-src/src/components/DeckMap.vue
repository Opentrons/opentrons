<template>
  <section id="deck-map">
  {{pipettes}}
    <button  v-for="instrument in tasks.instruments" 
    class="tab" :class="{active : activePipette(instrument)}"  
    @click="togglePipette(instrument.axis)"> 
    {{instrument.axis}} {{instrument.label}}<span v-for="c in instrument.channels">&#9661;</span>
    </button>
    <div class="deck-wrapper">
      <div class="deck-container">
       <div v-for="col in cols" class="deck-col">
          <div v-for="row in rows" class="deck-slot" :id="col+row" :class="{active : isActive(col+row), occupied: hasContainer(col+row)}">
              <container v-if="hasContainer(col+row)" :placeable="getContainer(col+row)"></container>
              <div v-else class="empty"><p>{{col+row}}</p></div>
         </div>
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
        cols: ['A', 'B', 'C', 'D', 'E'],
        activeSlot: this.$route.params.slot
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
      tasks () {
        return this.$store.state.tasks
      },
      pipettes () {
        return this.$store.state.tasks.pipettes
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
        this.$router.push({ name: 'instrument', params: { instrument: axis, slot: null } })
      }
    },
    watch: {
      '$route' (to, from) {
        this.activeSlot = to.params.slot
      }
    }
  }

</script>