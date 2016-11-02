
from opentrons.robot import Robot
from opentrons import containers, instruments


# In[2]:

robot = Robot()


# In[13]:

robot.reset()
tiprack = containers.load('tiprack-10ul', 'B2', 'tiprack')
plate = containers.load('96-flat', 'C2', 'plate')


# In[18]:

p = instruments.Pipette(axis="b", tip_racks=[tiprack])


# In[21]:

robot.clear()
p.pick_up_tip()

for well in plate[0:3]:
    p.aspirate(10, well).dispense(10, next(well))

p.return_tip()


# In[24]:

# robot.commands()
# robot.simulate(switches=True)


# In[25]:

# from opentrons.containers import legacy_containers
# list(legacy_containers.legacy_containers_dict.keys())


# In[ ]:
