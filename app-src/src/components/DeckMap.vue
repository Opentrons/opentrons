<template>
  <section id="deck-map">
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
      }
    }
  }

</script>