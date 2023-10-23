import { getMigrationMessage } from '../modalContents'
describe('modalContents', () => {
  describe('getMigrationMessage', () => {
    it('should return the v3 migration message when migrating to v3', () => {
      const migrationsList = [
        ['3.0.0'],
        ['3.0.0', '4.0.0'],
        ['3.0.0', '4.0.0', '5.0.0'],
        ['3.0.0', '4.0.0', '5.0.0', '5.1.0'],
        ['3.0.0', '4.0.0', '5.0.0', '5.1.0, 5.2.0'],
      ]
      migrationsList.forEach(migrations => {
        expect(JSON.stringify(getMigrationMessage(migrations))).toEqual(
          expect.stringContaining(
            'Updating your protocol to use the new labware definitions will consequently require you to re-calibrate all labware in your protocol'
          )
        )
      })
    })
    it('should return the "no behavior change message" when migrating from v5.x to 6', () => {
      const migrationsList = [
        ['5.0.0'],
        ['5.0.0', '5.1.0'],
        ['5.0.0', '5.1.0', '5.2.0'],
      ]
      migrationsList.forEach(migrations => {
        expect(JSON.stringify(getMigrationMessage(migrations))).toEqual(
          expect.stringContaining(
            'we do not expect any changes in how the robot will execute this protocol'
          )
        )
      })
    })
    it('should return the generic migration modal when a v4 migration or v7 migration is required', () => {
      const migrationsList = [
        ['4.0.0'],
        ['4.0.0', '5.0.0'],
        ['4.0.0', '5.0.0', '5.1.0'],
        ['4.0.0', '5.0.0', '5.1.0, 5.2.0'],
        ['6.0.0', '6.1.0', '6.2.0', '6.2.1', '6.2.2'],
      ]
      migrationsList.forEach(migrations => {
        expect(JSON.stringify(getMigrationMessage(migrations))).toEqual(
          expect.stringContaining(
            'Updating the file may make changes to liquid handling actions'
          )
        )
      })
    })
  })
})
