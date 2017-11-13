
cd /usr/src/api
export API_IS_RUNNING=true
python /usr/src/api/opentrons/server/main.py '0.0.0.0':31950
export API_IS_RUNNING=false
