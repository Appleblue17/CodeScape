## How to Run

### Environment setup

- Install node.js, python3.
- Install js dependencies.
```bash
cd frontend
npm install
cd backend
npm install
```

### Run the server

- Start the backend server.

```bash
cd backend
npm run start
```

### Run the client

- Install Live Server extension in VSCode.
- Right click on `frontend/index.html` and select `Open with Live Server` to open the webpage in the browser.
- You should see the display in the server console.

## Local Deployment Guide for ComfyUI API

This project provides instructions for deploying ComfyUI locally and calling ComfyUI via API in Python scripts, enabling custom usage.

### 1. Clone the Official ComfyUI Repository

```cmd
git clone https://github.com/comfyanonymous/ComfyUI.git
```

### 2. Obtain a Valid ComfyUI Workflow

Since the Python script only provides prompt-to-image functionality, use the text2image workflow provided in class: `simple-text-2-image-DreamShaper.json`, which is placed in the folder.

### 3. Run ComfyUI

Navigate to the ComfyUI folder:

```cmd
cd ComfyUI
```

Run `main.py` and open ComfyUI using the URL provided in the command line interface:

```cmd
python main.py
```

### 4. Obtain the Workflow API

Drag the original workflow `simple-text-2-image-DreamShaper.json` into the ComfyUI interface.

![ComfyUI Interface Screenshot](./pregen//instruction_pic/UI.png)

Click the gear icon in the lower left corner of the page, and enable developer mode in the settings to run the workflow and download it as an API.
![ComfyUI Interface Screenshot 2](./pregen//instruction_pic/UI2.png)

Then click save in the upper left corner of the interface, save the workflow as an API, and save it to the current directory:
![ComfyUI Interface Screenshot 3](./pregen//instruction_pic/UI3.png)

Rename the workflow API in the current directory to `workflow_api.json`.

### 5. Run the Script in the Current Directory

Run the Python script `api.py` in the current folder:

```cmd
python api.py
```

The current script is set to read user input from the CLI and overwrite `workflow_api.json`, which is then read by ComfyUI as an API workflow to generate images and save them to the specified folder. The current output folder is `output`. If needed, modify the `WORKING_DIR` variable in the script to change the output folder.
<br><br>

## How to start a talk with AI?

### 1. Download the Ollama Interface and check its status on the cmd:
```cmd
ollama --version
```
### 2. Pull a suitable model from the official Ollama repository. We use phi3 model here as a light scale model for chatting:
```cmd
ollama pull phi3
```

### 3. Run the model to ensure it's properly deployed locally:
```cmd
ollama run phi3
```

### 4. Change the current working directory into `chat` and run `LLM_server.py` to establish the connection between the model and the server:
```cmd
cd chat
python LLM_server.py
```

### 5. Now You can chat with the model after granting access of your pc's microphone. Try to say `chat mode` and the chat mode will be activated. Then you can try to chat with the model. To exit chat mode, just say: `exit chat mode`
