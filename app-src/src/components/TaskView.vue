<template>
  
    <section id="task-view" >
      <section id="placeable-pane">  
        <!-- Placeable Info -->
        <h1 :class="{calibrated : instrument().calibrated,  active: $route.params.placeable }">
          {{$route.params.placeable}} at slot {{$route.params.slot}}
          <span class="more-info">
          <a role="button" id="show-modal" @click="showModalPlaceable = true">?</a>
          </span>
        </h1> 

        <!-- Placeable Modal -->
        <modal v-if="showModalPlaceable" @close="showModalPlaceable = false" :placeable="placeable()" :instrument="instrument()">
        </modal>

        <!-- Placeable Nav / Deck Map -->
        <deck-navigation  :instrument='instrument()' :deck='deck()'></deck-navigation>
        
        <!-- Placeable Calibration -->
        <placeable-calibration v-if="$route.params.placeable" :instrument='instrument()' :deck='deck()' :placeable="placeable()"></placeable-calibration>
      </section>

      <section id="instrument-pane">
        <!-- Instrument Info -->
        <h1>{{instrument().label}} {{channels}} [{{instrumentLocation}}]</h1>
        
        <instrument-navigation :instrument='instrument()' @updatePos="plungerPos = $event" ></instrument-navigation>

        <!--- Instrument Calibration -->
        <!-- v-if="!$route.params.placeable" -->
        <instrument-calibration v-if="!$route.params.placeable" :instrument="instrument()" :position="plungerPos"></instrument-calibration>

        </section>
      </section>

    </section>

  <!-- TODO: Move run screen logic to runlog panel at bottom of app -->
  <!--   <RunScreen class='run-screen' v-show='running()'></RunScreen> -->
</template>

<script>
  // import RunScreen from './RunScreen.vue'
  import PlaceableCalibration from './PlaceableCalibration'
  import DeckNavigation from './DeckNavigation'
  import Modal from './Modal.vue'
  import InstrumentNavigation from './InstrumentNavigation'
  import InstrumentCalibration from './InstrumentCalibration'

  export default {
    name: 'TaskView',
    props: ['busy'],
    data () {
      return {
        axis: this.$route.params.instrument,
        plungerPos: 'top',
        showModalPlaceable: false
      }
    },
    components: {
      DeckNavigation,
      PlaceableCalibration,
      Modal,
      InstrumentCalibration,
      InstrumentNavigation
    },
    computed: {
      channels () {
        return this.instrument().channels === 1 ? 'single' : 'multi'
      },
      instrumentLocation () {
        return this.instrument().axis === 'a' ? 'right' : 'left'
      }
    },
    methods: {
      placeable () {
        let container = this.deck().find(element => element.slot === this.$route.params.slot)
        return container
      },
      params () {
        return this.$route.params
      },
      deck () {
        return this.$store.state.tasks.deck
      },
      instrument () {
        let instrument = this.$store.state.tasks.instruments.find(element => element.axis === this.axis)
        return instrument
      }
    },
    watch: {
      '$route' (to, from) {
        this.axis = to.params.instrument
      }
    }
  }
</script>