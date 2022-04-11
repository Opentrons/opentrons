

ot2-dev-requirements.txt: common-dev.in opentrons-editable.in ot2-dev-dep.in
	pip-compile $^ --output-file $@


ot3-dev-requirements.txt: common-dev.in opentrons-editable.in ot3-dev-dep.in
	pip-compile $^ --output-file $@


ot2-prod-requirements.txt: opentrons-prod.in
	pip-compile $^ --output-file $@


ot3-prod-requirements.txt: opentrons-prod.in
	pip-compile $^ --output-file $@
