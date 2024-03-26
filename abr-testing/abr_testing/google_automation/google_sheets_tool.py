import gspread
import socket
import httplib2
import oauth2client
from oauth2client.service_account import ServiceAccountCredentials
from typing import Dict, List, Any, Set

"""This module requires a credentials.json file before getting started."""


class google_sheet:
    """
    This module was designed for the testing team to automate tests by
    ultizing google sheets API to record data. The following attributes that this
    class needs is the file_name and the tab_number define.
    """

    def __init__(self, credentials, file_name, tab_number):
        self.scope = [
            "https://spreadsheets.google.com/feeds",
            "https://www.googleapis.com/auth/drive",
        ]
        self.credentials = ServiceAccountCredentials.from_json_keyfile_name(
            credentials, self.scope
        )
        self.gc = gspread.authorize(self.credentials)
        self.file_name = file_name
        self.tab_number = tab_number
        self.spread_sheet = self.open_google_sheet()
        self.worksheet = self.open_worksheet(self.tab_number)
        self.row_index = 1

    def open_google_sheet(self):
        """Open Google Spread Sheet"""
        sheet = self.gc.open(self.file_name)
        return sheet

    def open_worksheet(self, tab_number: int) -> classmethod:
        """Open individual worksheet within a googlesheet"""
        return self.spread_sheet.get_worksheet(tab_number)

    def create_worksheet(self, tab_name: int):
        """Create a worksheet with a title for a tab. This method need
        to have an existing spreadsheet for it to work."""
        try:
            self.spread_sheet.add_worksheet(tab_name, rows="1000", cols="26")
        except gspread.exceptions.APIError:
            print("Work Sheet already exists")

    def write_header(self, header: List):
        """Write Header to first row, this method as determines if the first row
        has a header that identical to the header the user is writing too."""
        header_list = self.worksheet.row_values(1)
        if header_list != header:
            self.worksheet.insert_row(header, self.row_index)

    def write_to_row(self, data: List):
        """Write data into a row in a List[] format, this method skips the first
        row of the worksheet due to headers."""
        try:
            self.row_index += 1
            self.worksheet.insert_row(data, index=self.row_index)
        except socket.gaierror:
            pass
        except httplib2.ServerNotFoundError:
            print("UNABLE TO CONNECT TO SERVER!!, CHECK CONNECTION")
        except Exception as error:
            print(error.__traceback__)

    def delete_row(self, row_index: int):
        """Delete Row from google sheet"""
        self.worksheet.delete_row(row_index)

    def update_cell(self, row: int, column: int, single_data: Any):
        """Update an individual cell according to a row and column. Note that
        this function only updates one individual cell"""
        self.worksheet.update_cell(row, column, single_data)

    def get_all_data(self) -> Dict[str, Any]:
        """Get all the Data recorded from worksheet."""
        return self.worksheet.get_all_records()

    def get_column(self, column_number: int) -> Set[str]:
        return self.worksheet.col_values(column_number)

    def get_index_row(self):
        """Check for the next available row to write too."""
        row_index = len(self.get_column(1))
        print("Row Index: ", row_index)
        return row_index

    def update_row_index(self):
        """Update self.row_index instance variable"""
        self.row_index = self.get_index_row()

    def get_all_sheets(self):
        """List all tabs in the spreadsheets"""
        worksheets = self.spread_sheet.worksheets()
        return worksheets

    def get_sheet_by_name(self, title: str):
        """Reference sheet by name."""
        try:
            worksheet = self.spread_sheet.worksheet(title)
            return worksheet
        except gspread.exceptions.WorksheetNotFound:
            raise  gspread.exceptions.WorksheetNotFound(
            "Worksheet does not exist!!, create a worksheet first using the create_worksheet() function."
        )
    def token_check(self):
        """Check if still credentials are still logged in."""
        if self.credentials.access_token_expired:
            self.gc.login()
