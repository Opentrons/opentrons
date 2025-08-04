requirements = {
	"robotType": "Flex",
	"apiLevel": "2.24"
}

metadata = {
    "protocolName":'Liquid Class keep last tip',
    'author':'QA'
}

def run(protocol_context):
	tiprack = protocol_context.load_labware("opentrons_flex_96_tiprack_1000ul", "C2")
	trash = protocol_context.load_trash_bin('A3')
	pipette_1k = protocol_context.load_instrument("flex_1channel_1000", "right", tip_racks=[tiprack])
	nest_plate = protocol_context.load_labware("nest_96_wellplate_2ml_deep", "D1")
	arma_plate = protocol_context.load_labware("armadillo_96_wellplate_200ul_pcr_full_skirt", "D3")

	water_class = protocol_context.get_liquid_class("water")

	pipette_1k.pick_up_tip()
	
	# Tip should stay on at the end, default behavior
	pipette_1k.transfer_with_liquid_class(
		liquid_class=water_class,
		volume=200,
		source=nest_plate['A1'],
		dest=arma_plate['A1'],
		new_tip="never",
		trash_location=trash,
	)
	# Tip should be dropped at the end
	pipette_1k.transfer_with_liquid_class(
		liquid_class=water_class,
		volume=200,
		source=nest_plate['A1'],
		dest=arma_plate['A1'],
		new_tip="never",
		trash_location=trash,
		keep_last_tip=False,
	)

	# Tip should be dropped at the end, default behavior
	pipette_1k.transfer_with_liquid_class(
		liquid_class=water_class,
		volume=200,
		source=nest_plate['A1'],
		dest=arma_plate['A1'],
		new_tip="once",
		trash_location=trash,
	)
	# Tip should be kept at the end
	pipette_1k.transfer_with_liquid_class(
		liquid_class=water_class,
		volume=200,
		source=nest_plate['A1'],
		dest=arma_plate['A1'],
		new_tip="once",
		trash_location=trash,
		keep_last_tip=True,
	)
	pipette_1k.drop_tip()