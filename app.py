import gradio as gr
import requests
import uuid
import os

def string_to_binary(input_string):
    binary_string = ''.join(format(ord(char), '08b') for char in input_string)
    return binary_string


def upload_protocol(protocol_name):
    robot_ip = "localhost"
    # robot_url = "https://baxin-ot-analysis.hf.space"
    endpoint = f"http://{robot_ip}:31950/protocols"
    # protocol_name = generate_unique_name()

    protocol_file = open(protocol_name, "rb")
    files = {
        "files": (protocol_name, protocol_file),
    }


    headers = {"Opentrons-Version": "3"}
    response = requests.post(endpoint, headers=headers, files=files)
    response_data = response.json()
    
    protocol_file.close()
    if os.path.exists(protocol_name):
    # if the protocol file is existing, remove it
        os.remove(protocol_name)

    if 'data' in response_data:
        response_data = response.json()
        protocol_id = response_data["data"]["id"]
        analysis_result=response_data["data"]["analyses"]
        analysis_id = response_data["data"]["analysisSummaries"][0]["id"]
        analysis_status = response_data["data"]["analysisSummaries"][0]["status"]
        print(protocol_id)
        print(analysis_result)
        print(analysis_id)
        print(analysis_status)
        return f"success\n protocol_id:{protocol_id}\n analysis_id:{analysis_id}"
    else:
        print("analysis error")
        error_id = response_data["errors"][0]['id']
        error_code = response_data["errors"][0]["errorCode"]
        error_detail = response_data["errors"][0]['detail']
        print(error_id)
        print(error_code)
        print(error_detail)
        return f"{error_id}\n{error_code}\n{error_detail}"

def generate_unique_name():
    unique_name = str(uuid.uuid4()) + ".py"
    return unique_name

def send_post_request(payload):
    url = "https://baxin-simulator.hf.space/protocol"
    protocol_name = generate_unique_name()
    data = {"name": protocol_name, "content": payload}
    headers = {"Content-Type": "application/json"}

    response = requests.post(url, json=data, headers=headers)

    if response.status_code != 200:
        print("Error: " + response.text)
        return "Error: " + response.text

    # Check the response before returning it
    response_data = response.json()
    if "error_message" in response_data:
        print("Error in response:", response_data["error_message"])
        return response_data["error_message"]
    elif "protocol_name" in response_data:
        print("Protocol executed successfully. Run log:", response_data["run_log"])
        return response_data["run_log"]
    else:
        print("Unexpected response:", response_data)
        return "Unexpected response"




def send_message(text, chatbot):
   # Send POST request and get response
#    response = send_post_request(text)
#    binary_protocol = string_to_binary(text)
    protocol_name = generate_unique_name()
    with open(protocol_name, "w") as file:
        file.write(text)

    response = upload_protocol(protocol_name)
    # Update chatbot with response
    chatbot.append(("opentrons analysis result", response))
    return chatbot

with gr.Blocks() as app:
    textbox = gr.Textbox()
    send_button = gr.Button(value="Send")
    chatbot = gr.Chatbot()
    clear_button = gr.ClearButton([textbox, chatbot])
    send_button.click(send_message, [textbox, chatbot], [chatbot])

app.launch()
