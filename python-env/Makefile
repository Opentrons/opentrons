pip-compile-opts ?= -v


ot2-prod-requirements.txt: ot2-prod-requirements.in
	pip-compile $(pip-compile-opts) $^ --output-file $@


ot3-prod-requirements.txt: ot3-prod-requirements.in
	pip-compile $(pip-compile-opts) $^ --output-file $@


ot2-dev-requirements.txt: common-dev.in ot2-dev-requirements.in
	pip-compile $(pip-compile-opts) $^ --output-file $@


ot3-dev-requirements.txt: common-dev.in ot3-dev-requirements.in
	pip-compile $(pip-compile-opts) $^ --output-file $@

all: ot2-prod-requirements.txt ot3-prod-requirements.txt ot2-dev-requirements.txt ot3-dev-requirements.txt