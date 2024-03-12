#!/bin/bash
echo starting the script
python3 -c "from hardware_testing.abr_tools.abr_robots import ABR_IPS"
declare -A ABR_IPS
echo $ABR_IPS
for robot in "${!ABR_IPS[@]}"; do
    echo inside the loop
    ip="${ABR_IPS[$robot]}"
    if ssh -i ~/.ssh/robot_key "root@$ip" exit; then
        echo "SSH to $robot at $ip successful"
        ssh -i ~/.ssh/robot_key "root@$ip" << EOF
        nohup python3 -m hardware_testing.scripts.abr_asair_sensor $robot 540 5 &
EOF
    else
        echo "SSH to $robot at $ip failed"
    fi
done
