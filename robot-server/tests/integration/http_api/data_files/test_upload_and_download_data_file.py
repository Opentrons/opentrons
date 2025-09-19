from tests.integration.robot_client import RobotClient


async def test_upload_and_download_data_file(
    ot2_server_base_url: str,
) -> None:
    """Test uploading data files and downloading the contents."""
    async with RobotClient.make(
        base_url=ot2_server_base_url, version="*"
    ) as robot_client:
        response = await robot_client.post_data_files(
            req_body={"filePath": "./tests/integration/data_files/test.csv"}
        )
        assert response.status_code == 201
        response_data = response.json()["data"]
        assert response_data["name"] == "test.csv"

        data_file_id = response_data["id"]

        response = await robot_client.get_data_files_download(data_file_id=data_file_id)
        assert response.status_code == 200
        assert response.read().decode("utf-8") == "a,b,c\n1,2,3\nx,y,z"
