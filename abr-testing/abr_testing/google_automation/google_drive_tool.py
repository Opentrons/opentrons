import os
import oauth2client
from oauth2client.service_account import ServiceAccountCredentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

"""This module requires a creditials.json file before getting started.
The following link provides a step by step tutorial on how to get startd."""


class google_drive:
    """
    This module was designed for the ABR team to automate run log data upload to google drive.
    A credentials file is needed to start.
    """

    def __init__(self, credentials, folder_name, parent_folder):
        self.scope = ["https://www.googleapis.com/auth/drive"]
        self.credentials = ServiceAccountCredentials.from_json_keyfile_name(
            credentials, self.scope
        )
        self.drive_service = build("drive", "v3", credentials=self.credentials)
        self.folder_name = folder_name
        self.parent_folder = parent_folder

    def create_folder(self):
        """Create a folder in Google Drive and return its ID."""
        folder_metadata = {
            "name": self.folder_name,
            "mimeType": "application/vnd.google-apps.folder",
            "parents": [self.parent_folder] if self.parent_folder else [],
        }

        created_folder = (
            self.drive_service.files()
            .create(body=folder_metadata, fields="id")
            .execute()
        )

        print(f'Created Folder ID: {created_folder["id"]}')
        return created_folder["id"]

    def list_folder(self, delete=False):
        """List folders and files in Google Drive."""
        file_names = set()
        page_token = None
        while True:
            results = (
                self.drive_service.files()
                .list(
                    q=f"'{self.parent_folder}' in parents and trashed=false"
                    if self.parent_folder
                    else None,
                    pageSize=1000,
                    fields="nextPageToken, files(id, name, mimeType)",
                    pageToken=page_token,
                )
                .execute()
            )
            items = results.get("files", [])
            if not items:
                break
            for item in items:
                item_name = item["name"]
                if delete:
                    self.delete_files(item["id"])
                file_names.add(item_name)
            page_token = results.get("nextPageToken")
            if not page_token:
                break
            if not file_names:
                print("No folders or files found in Google Drive.")
        print(f"{len(file_names)} item(s) in Google Drive")
        return file_names

    def delete_files(self, file_or_folder_id: str):
        """Delete a file or folder in Google Drive by ID."""
        try:
            self.drive_service.files().delete(fileId=file_or_folder_id).execute()
            print(f"Successfully deleted file/folder with ID: {file_or_folder_id}")
        except Exception as e:
            print(f"Error deleting file/folder with ID: {file_or_folder_id}")
            print(f"Error details: {str(e)}")

    def upload_file(self, file_path: str):
        """Upload file to Google Drive."""
        file_metadata = {
            "name": os.path.basename(file_path),
            "parents": [self.parent_folder] if self.parent_folder else [],
        }

        media = MediaFileUpload(file_path, resumable=True)

        uploaded_file = (
            self.drive_service.files()
            .create(body=file_metadata, media_body=media, fields="id")
            .execute()
        )

        return uploaded_file["id"]

    def upload_missing_files(self, storage_directory: str, missing_files: set):
        """Upload missing files to Google Drive."""
        uploaded_files = []
        for file in missing_files:
            file_path = os.path.join(storage_directory, file)
            uploaded_file_id = google_drive.upload_file(self, file_path)
            uploaded_files.append(
                {"name": os.path.basename(file_path), "id": uploaded_file_id}
            )
        # Fetch the updated file list after all files are uploaded
        files = google_drive.list_folder(self)
        file_names = [file for file in files]
        for uploaded_file in uploaded_files:
            if uploaded_file["name"] in file_names:
                print(
                    f"File '{uploaded_file['name']}' was successfully uploaded with ID: {uploaded_file['id']}"
                )
            else:
                print(
                    f"File '{uploaded_file['name']}' was not found in the list of files after uploading."
                )
