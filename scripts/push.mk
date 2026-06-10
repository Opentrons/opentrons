# utilities for pushing things to robots in a reusable fashion

find_robot=$(shell pnpm run -s discovery find -i 169.254)
default_ssh_key := ~/.ssh/id_rsa
default_ssh_opts := -o stricthostkeychecking=no -o userknownhostsfile=/dev/null
version_dict=$(shell ssh $(call id-file-arg,$(2)) $(3) root@$(1) cat /etc/VERSION.json)
is-ot3=$(findstring OT-3, $(version_dict))
# make version less than 4.4 do not use intcmp
allowed-ssh-versions="1 2 3 4 5 6 7 8"
# in order to use comma in a string we have to set it to a var
comma=,
# string manipulations to extract the int version number
ssh-version-output = $(shell ssh -V 2>&1)
ssh-version-words=$(subst _, ,$(filter OpenSSH_%, $(ssh-version-output)))
ssh-version-label=$(or $(filter %p1$(comma),$(ssh-version-words)), $(filter %p1,$(ssh-version-words)))
ssh-version-number=$(subst ., ,$(firstword $(subst p, ,$(ssh-version-label))))
checked-ssh-version=$(if $(ssh-version-number),$(ssh-version-number),$(warning "Could not find ssh version for version $(ssh-version-output), scp flags may be wrong")))
is-in-version=$(findstring $(firstword $(checked-ssh-version)),$(allowed-ssh-versions))
# when using an OpenSSH version larger than 8.9,
# we need to add a flag to use legacy scp with SFTP protocol
scp-legacy-option-flag = $(if $(is-in-version),,-O)
# when using windows, make is running against a different openSSH than the OS.
# adding the -O flag to scp will fail if the openSSH on OS is less than 9.
# if openSSH on OS is 9 or more please add the -O flag to scp.
PLATFORM := $(shell uname -s)
is-windows=$(findstring $(PLATFORM), Windows)
$(if $(is-windows), echo "when using windows with an openSSH version larger then 9 add -O flag to scp command. see comments for more details")

here=$(dir $(lastword "$(MAKEFILE_LIST)"))
# push-python: universal installer for python dists to robots
# argument 1 is the host to push to
# argument 2 is the identity file to use, if any
# argument 3 is any further ssh options, quoted
# argument 4 is the path to the sdist locally
# argument 5 is the path to go to on the remote side
define push-python
scp $(call id-file-arg,$(2)) $(scp-legacy-option-flag) $(3) "$(4)" root@$(1):/var/$(notdir $(4))
scp $(call id-file-arg,$(2)) $(scp-legacy-option-flag) $(3) "$(here)/install-dist-remote.sh" root@$(1):/var/
ssh $(call id-file-arg,$(2)) $(3) root@$(1) "chmod a+x /var/install-dist-remote.sh"
ssh $(call id-file-arg,$(2)) $(3) root@$(1) "/var/install-dist-remote.sh \"/var/$(notdir $(4))\" \"$(5)\""
endef

# restart-service: ssh to a robot and restart one of its systemd units
#
# argument 1 is the host to push to
# argument 2 is the identity file to use, if any
# argument 3 is any further ssh options, quoted
# argument 4 is the service name
define restart-service
ssh $(call id-file-arg,$(2)) $(3)  root@$(1) \
"systemctl restart $(4)"
endef

# stop-service: ssh to a robot and stop one of its systemd units
#
# argument 1 is the host to push to
# argument 2 is the identity file to use, if any
# argument 3 is any further ssh options, quoted
# argument 4 is the service name
define stop-service
ssh $(call id-file-arg,$(2)) $(3)  root@$(1) \
"systemctl stop $(4)"
endef

# start-service: ssh to a robot and start one of its systemd units
#
# argument 1 is the host to push to
# argument 2 is the identity file to use, if any
# argument 3 is any further ssh options, quoted
# argument 4 is the service name
define start-service
ssh $(call id-file-arg,$(2)) $(3)  root@$(1) \
"systemctl start $(4)"
endef

# push-systemd-unit: move a systemd unit file to the robot
#
# argument 1 is the host to push to
# argument 2 is the identity file to use, if any
# argument 3 is any further ssh options, quoted
# argument 4 is the unit file path
define push-systemd-unit
	scp $(call id-file-arg,$(2)) $(scp-legacy-option-flag) $(3) "$(4)" root@$(1):/data/
	ssh $(call id-file-arg,$(2)) $(3) root@$(1) "mount -o remount,rw / && mv /data/$(notdir $(4)) /etc/systemd/system/ && systemctl daemon-reload && mount -o remount,ro / || mount -o remount,ro /"
endef

# id-file-arg: Internal helper for generating the -i arg for ssh/scp commands
#
# argument 1 is the identity file to use, if any
id-file-arg = $(if $(1),-i "$(1)")

# VERSION_HELPER: helper python script to update a dict with some entries
# NOTE: This is only to be used in the context of sync-version-file function
# Since we are using global args $(4) in this case which is only meaning there.
define VERSION_HELPER
import json;
a=$(version_dict);
a.update($(4));
fd = open("new_version_file.json", "w");
json.dump(a, fd, indent=2);
fd.close()
endef

# sync-version-file: ssh to the robot and update the VERSION.json file
#
# argument 1 is the host to push to
# argument 2 is the identity file to use, if any
# argument 3 is any further ssh options, quoted
# argument 4 is the package version dict to update the VERSION.json file with
define sync-version-file
	@echo package-version: $(4)
	$(shell python -c '$(VERSION_HELPER)')
	$(eval filepath=$(shell find . -type f -name new_version_file.json))
	scp $(call id-file-arg,$(2)) $(scp-legacy-option-flag) $(3) "${filepath}" root@$(1):/data/VERSION.json
	ssh $(call id-file-arg,$(2)) $(3) root@$(1) "mount -o remount,rw / && cp /data/VERSION.json /etc/VERSION.json && mount -o remount,ro / || mount -o remount,ro /"
	rm -rf "${filepath}"
endef
