from hardware_testing.drivers.flowrate_sensor import driver
import asyncio
import logging
import datetime

async def main(file_name, loop):
    sensor = await driver.MassFlowSensor.create(port="/dev/ttyACM1", csv_path=file_name, loop=loop)
    try:
        sensor.set_csv_filename(file_name)
        await sensor.read_continuous_data()
        await loop.sleep(10)
        await sensor.stop()
    except Exception as e:
        logging.critical("Critical failure: %s", e)


if __name__ == "__main__":
    logging.info("Flow rate sensor initialized.")
    current_datetime = datetime.datetime.now(datetime.UTC)
    file_name = str(f'/data/testing_data/example-test/FlowrateData_{current_datetime}.csv')
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    asyncio.run(main(file_name, loop))
    