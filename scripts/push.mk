# utilities for pushing things to robots in a reusable fashion

find_robot=$(shell yarn run -s discovery find -i 169.254)
default_ssh_key := ~/.ssh/robot_key
default_ssh_opts := -o stricthostkeychecking=no -o userknownhostsfile=/dev/null
is-ot3 = $(shell ssh $(if $(2),"-i $(2)") $(3) root@$(1) systemctl status opentrons-robot-app)
SSH-VERSION=$(shell ssh -V 2>&1)
need-scp-option-from-version=9.0
# example with text functions
# need-copy-scp := $(filter ‘[0-9]{,2}.[0-9]’, $($(subst p1, ,($(subst _, ,$(SSH-VERSION))))))
# $(info $(subst p1, ,($(subst _, ,$(SSH-VERSION)))))

$(info $$ssh is $(SSH-VERSION))
$(info $$need-copy-scp is [${need-copy-scp}])

ssh_version := $(shell ssh -V 2>&1 | grep -o "[0-9]*\.[0-9]*" | head -1)
$(info $(ssh_version))

is-ge = $(shell if ("$(ssh_version)" -ge "$(need-copy-scp-version)" | bc); then echo "a is more than 5"; fi)

need-scp-option = $(shell if [ "$(shell ssh -V 2>&1 | grep -o "[0-9]*\.[0-9]*" | head -1)" -ge 9 ]; then echo 1; fi)
$(info $(need-scp-option))

# push-python-package: execute a push to the robot of a particular python
# package.
#
# argument 1 is the host to push to
# argument 2 is the identity key to use
# argument 3 is any further ssh options, quoted
# argument 4 is the path to the wheel file

define push-python-package
$(if $(is-ot3), echo "This is an OT-3. Use 'make push-ot3' instead." && exit 1)
scp -i $(2) $(3) "$(4)" root@$(1):/data/$(notdir $(4))
ssh -i $(2) $(3) root@$(1) \
"function cleanup () { rm -f /data/$(notdir $(4)) && mount -o remount,ro / ; } ;\
mount -o remount,rw / &&\
cd /usr/lib/python3.7/site-packages &&\
unzip -o /data/$(notdir $(4)) && cleanup || cleanup"
endef

# push-python-sdist: push an sdist to an ot3
# argument 1 is the host to push to
# argument 2 is the identity key to use, if any
# argument 3 is any further ssh options, quoted
# argument 4 is the path to the sdist locally
# argument 5 is the path to go to on the remote side
# argument 6 is the python package name
# argument 7 is an additional subdir if necessary in the sdist
# argument 8 is either egg or dist (default egg)
define push-python-sdist
$(if $(is-ot3), ,echo "This is an OT-2. Use 'make push' instead." && exit 1)
scp $(if $(2),"-i $(2)") $(3) $(4) root@$(1):/var/$(notdir $(4))
ssh $(if $(2),"-i $(2)") $(3) root@$(1) \
"function cleanup () { rm -f /var/$(notdir $(4)) ; rm -rf /var/$(notdir $(4))-unzip; mount -o remount,ro / ; } ;\
 mkdir -p /var/$(notdir $(4))-unzip ; \
 cd /var/$(notdir $(4))-unzip && tar xf ../$(notdir $(4)) ; \
 mount -o remount,rw / ; \
 rm -rf $(5)/$(6) $(5)/$(6)*.egg-info ; \
 mv /var/$(notdir $(4))-unzip/$(basename $(basename $(notdir $(4))))/$(if $(7),$(7)/)$(6) $(5)/ ; \
 mv /var/$(notdir $(4))-unzip/$(basename $(basename $(notdir $(4))))/$(if $(7),$(7)/)$(6)*.$(if $(8),$(8),egg)-info $(5)/$(basename $(basename $(notdir $(4)))).$(if $(8),$(8),egg)-info ; \
 cleanup \
 "
endef

# restart-service: ssh to a robot and restart one of its systemd units
#
# argument 1 is the host to push to
# argument 2 is the identity key to use
# argument 3 is any further ssh options, quoted
# argument 4 is the service name

define restart-service
ssh -i "$(2)" $(3)  root@$(1) \
"systemctl restart $(4)"
endef

# push-systemd-unit: move a systemd unit file to the robot
# 
# argument 1 is the host to push to
# argument 2 is the identity key to use
# argument 3 is any further ssh options, quoted
# argument 4 is the unit file path
define push-systemd-unit
	scp -i $(2) $(3) "$(4)" root@$(1):/data/
	ssh -i $(2) $(3) root@$(1) "mount -o remount,rw / && mv /data/$(notdir $(4)) /etc/systemd/system/ && systemctl daemon-reload && mount -o remount,ro / || mount -o remount,ro /"
endef
