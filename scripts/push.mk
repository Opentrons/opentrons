# utilities for pushing things to robots in a reusable fashion

find_robot=$(shell yarn run -s discovery find -i 169.254 fd00 -c "[fd00:0:cafe:fefe::1]")
default_ssh_key := ~/.ssh/robot_key
default_ssh_opts := -o stricthostkeychecking=no -o userknownhostsfile=/dev/null

# push-command: execute a push to the robot of a particular python
# package.
#
# argument 1 is the host to push to
# argument 2 is the identity key to use
# argument 3 is any further ssh options, quoted
# argument 4 is the path to the wheel file

define push-python-package
scp -i $(2) $(3) "$(4)" root@$(1):/data/$(notdir $(4))
ssh -i $(2) $(3) root@$(1) \
"function cleanup () { rm -f /data/$(notdir $(4)) && mount -o remount,ro / ; } ;\
mount -o remount,rw / &&\
cd /usr/lib/python3.7/site-packages &&\
unzip -o /data/$(notdir $(4)) && cleanup || cleanup"
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
	ssh -i $(2) $(3) root@$(1) "mv /data/$(notdir $(4)) /etc/systemd/system/ && systemctl daemon-reload"
endef
