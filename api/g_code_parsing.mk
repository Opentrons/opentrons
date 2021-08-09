###############################
### G-Code Parsing Commands ###
###############################

# NOTE: The following 2 AWS commands `g-code-s3-pull` and `g-code-s3-push` expect you to have the following environment
# variables defined:  `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_DEFAULT_REGION `

# g-code-s3-pull
#	Description - Pull objects from S3 and output it's content to STDOUT
#	Required Parameters:
#		object_name - name of the S3 object you want to pull from the g-code-comparison bucket
#	Example:
#		make g-code-s3-pull object_name='smoothie-protocol-output.txt'
.PHONY: g-code-s3-pull
g-code-s3-pull:
	@aws s3 cp s3://g-code-comparison/$(object_name) -


# g-code-s3-push
#	Description - Push local file to S3
#	Required Parameters:
#		source_file_path - local path to the file you want to upload
#		object_name - name of file in S3
# 	Example:
#		make g-code-s3-push \
#		source_file_path=./api/tests/opentrons/data/g_code_validation_protocols/smoothie_protocol.py \
#		object_name='smoothie-protocol-output.txt'
.PHONY: g-code-s3-push
g-code-s3-push:
	@aws s3 cp $(source_file_path) s3://g-code-comparison/$(object_name)


# g-code-run
# 	Description - Run protocol against emulator and print parsed output to STDOUT
#	Required Parameters:
# 		text_mode - sets format for parsed output.
#			Can be the following values: `Default`, `Concise`, `G-Code`, or `JSON`
#		left_pipette - JSON configurations of the the OT-2 pipettes
#		right_pipette - JSON configurations of the the OT-2 pipettes
#		protocol_path - path to python protocol to run
#
#	Example:
#		make g-code-run \
#		text_mode=Concise
#		left_pipette='{"model": "p20_single_v2.0", "id": "P20SV202020070101"}' \
#		right_pipette='{"model": "p20_single_v2.0", "id": "P20SV202020070101"}' \
#		protocol_path='./tests/opentrons/data/g_code_validation_protocols/smoothie_protocol.py'
.PHONY: g-code-run
g-code-run:
	@$(python) src/opentrons/hardware_control/g_code_parsing/cli.py \
		run \
		--text-mode '$(text_mode)' \
		--left-pipette '$(left_pipette)' \
		--right-pipette '$(right_pipette)' \
		$(protocol_path) \
		2> /dev/null

master_file = /tmp/master_file.txt  # File pulled from S3
file_under_test = /tmp/file_under_test.txt
diff_file = /tmp/diff.html
text_mode = Concise


# g-code-diff
#	Description - Run diff and print HTML formatted result to stdout
#	Example 1 - Run against default files /tmp/master_file.txt and /tmp/file_under_test.txt
#		g-code-diff
#	Example 2 - Run against custom files paths
#		g-code-diff master_file=/path/to/master/file.txt file_under_test=/path/to/file/under/test.txt
.PHONY: g-code-diff
g-code-diff:
	@$(python) src/opentrons/hardware_control/g_code_parsing/cli.py \
		diff --error_on_different_files $(master_file) $(file_under_test)


# open-diff
#	Description - Helper function to open diff file in google-chrome
#	Example 1 - Open c
#		open-diff
#	Example 2 - Open /path/to/file.html
#		open-diff diff_file=/path/to/file.html
.PHONY: open-diff
open-diff:
	google-chrome file://$(diff_file)


####################
### G-CODE TESTS ###
####################

########################
# smoothie_protocol.py #
########################

# g-code-smoothie-protocol-run
#	Description - Run smoothie_protocol.py and store the output to /tmp/file_under_test.txt
.PHONY: g-code-smoothie-protocol-run
g-code-smoothie-protocol-run:
	@$(MAKE) --no-print-directory g-code-run \
		left_pipette='{"model": "p20_single_v2.0", "id": "P20SV202020070101"}' \
		right_pipette='{"model": "p20_single_v2.0", "id": "P20SV202020070101"}' \
		protocol_path='./tests/opentrons/data/g_code_validation_protocols/smoothie_protocol.py' \
  		> $(file_under_test)

# g-code-smoothie-protocol-run
#	Description - Run smoothie_protocol.py and compare it's output to S3 master file. Store the diff to /tmp/diff.html
.PHONY: g-code-smoothie-protocol-diff
g-code-smoothie-protocol-diff:
	@$(MAKE) --no-print-directory g-code-smoothie-protocol-run
	@$(MAKE) --no-print-directory g-code-s3-pull \
		object_name='smoothie-protocol-output.html' \
		> $(master_file)
	@$(MAKE) --no-print-directory g-code-diff \
	> /tmp/smoothie-diff.html


# g-code-smoothie-protocol-update-s3
#	Description - Run smoothie_protocol.py and override the S3 master file with it's output
.PHONY: g-code-smoothie-protocol-update-s3
g-code-smoothie-protocol-update-s3:
	@$(MAKE) --no-print-directory g-code-smoothie-protocol-run
	@$(MAKE) --no-print-directory g-code-s3-push \
		source_file_path=$(file_under_test) \
		object_name='smoothie-protocol-output.html'