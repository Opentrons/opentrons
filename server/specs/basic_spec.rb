require 'capybara'
require 'capybara/dsl'
require 'capybara/poltergeist'
require 'rspec'

Capybara.run_server = false
Capybara.javascript_driver = :poltergeist
Capybara.default_driver = :poltergeist
Capybara.app_host = 'http://localhost:5000'

RSpec.describe 'frontend' do
  include Capybara::DSL

  describe 'protocols' do
    it 'should return a 200' do
      visit '/protocol_setup/uniquekey1'
      expect(page.status_code).to eq(200)
    end

    it 'should display step IDs on each step' do
      %w(uniquekey1 cp1 cp2).each do |id|
        visit "/protocol_setup/#{id}"
        expect(page).to have_content("Step id:#{id}")
      end
    end
  end
end
