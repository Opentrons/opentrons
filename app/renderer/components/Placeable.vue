<template>
	<section id="task">
		<h1 class="title">
			Calibrate the {{this.instrument().label}} pipette to the
			{{this.containerType(this.type) == "tiprack" ? "center" : "bottom"}}
			{{this.calibrationPoint}} of your {{this.placeable.label}} container
		</h1>
		<CalibratePlaceable :placeable='placeable()' :instrument='instrument()'>
		</CalibratePlaceable>
		<div class="well-img">
			<img :src="`${placeableImages(this.type, this.channels)}`" />
		</div>
	</section>
</template>

<script>
	import CalibratePlaceable from './CalibratePlaceable.vue'

  export default {
    name: 'Placeable',
		components: {
			CalibratePlaceable
		},
    methods: {
			instrument() {
				return this.$store.state.tasks.filter((instrument) => {
					return instrument.axis === this.$route.params.instrument
				})[0]
			},
			placeable() {
				return this.instrument().placeables.filter((placeable) => {
					return placeable.label === this.$route.params.placeable
				})[0]
			},
			containerType(type){
				if (type === "point") {
					return "point"
				} else if (type.includes("tiprack")) {
					return "tiprack"
				} else if (type.includes("trough")) {
					return "trough"
				} else if (type.includes("tuberack")) {
					return "tuberack"
				}else {
					return "default"
				}
			},
			placeableImages(type, channels) {
				const imageUrls = {
					"default": {"single": "well_single", "multi": "well_multi"},
					"tiprack": {"single": "tiprack_single", "multi": "tiprack_multi"},
					"trough": {"single": "trough_single", "multi": "trough_multi"},
					"tuberack": {"single": "tuberack_single", "tuberack_single": ""},
					"point": {"single": "point_trash", "multi": "point_trash"}
				}
				return require(`../assets/img/${imageUrls[type][channels]}.png`)
			}
    },
		computed: {
			type() {
				let placeable = this.placeable()
				let type = this.containerType(placeable.type)
				return type
			},
			channels() {
				console.log(typeof(this.instrument.channels), this.instrument.channels)
				return this.instrument().channels === 1 ? "single" : "multi"
			},
			calibrationPoint() {
				let type = this.containerType(this.type)
				let position = "of the A1 well"
				if (type == "trough") {
					position = "of the A1 slot"
				} else if ((type == "tiprack" || type == "default") && this.instrument.channels == 8) {
					position = "of the A1 row"
				} else if (type == "point") {
					position = ""
				}
				return position
			}
		},
		created: function() {
			if (this.$store.state.tasks) {
				this.$store.dispatch("loadProtocol")
			}
		}
  }
</script>
