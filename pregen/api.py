import json
import websocket  # NOTE: websocket-client (https://github.com/websocket-client/websocket-client)
import uuid
import urllib.request
import urllib.parse
import random
from websocket_server import WebsocketServer
import threading

# 设置全局工作目录和项目相关的路径

# 输出目录
WORKING_DIR = 'output'
SageMaker_ComfyUI = WORKING_DIR

# 工作流文件
workflowfile = 'workflow_api.json'
COMFYUI_ENDPOINT = '127.0.0.1:8188'

server_address = COMFYUI_ENDPOINT
client_id = str(uuid.uuid4())  # 生成一个唯一的客户端ID
# 随机种子
seed = 181473514749868

# 定义一个函数来显示GIF图片
def show_gif(fname):
    import base64
    from IPython import display
    with open(fname, 'rb') as fd:
        b64 = base64.b64encode(fd.read()).decode('ascii')
    return display.HTML(f'<img src="data:image/gif;base64,{b64}" />')

# 定义一个函数向服务器队列发送提示信息
def queue_prompt(prompt):
    p = {"prompt": prompt, "client_id": client_id}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request("http://{}/prompt".format(server_address), data=data)
    return json.loads(urllib.request.urlopen(req).read())

# 定义一个函数来获取图片
def get_image(filename, subfolder, folder_type):
    data = {"filename": filename, "subfolder": subfolder, "type": folder_type}
    url_values = urllib.parse.urlencode(data)
    with urllib.request.urlopen("http://{}/view?{}".format(server_address, url_values)) as response:
        return response.read()

# 定义一个函数来获取历史记录
def get_history(prompt_id):
    with urllib.request.urlopen("http://{}/history/{}".format(server_address, prompt_id)) as response:
        return json.loads(response.read())

# 定义一个函数来获取图片，这涉及到监听WebSocket消息
def get_images(ws, prompt):
    prompt_id = queue_prompt(prompt)['prompt_id']
    print('prompt')
    print(prompt)
    print('prompt_id:{}'.format(prompt_id))
    output_images = {}
    while True:
        out = ws.recv()
        if isinstance(out, str):
            message = json.loads(out)
            if message['type'] == 'executing':
                data = message['data']
                if data['node'] is None and data['prompt_id'] == prompt_id:
                    print('执行完成')
                    break  # 执行完成
        else:
            continue  # 预览为二进制数据

    history = get_history(prompt_id)[prompt_id]
    print(history)
    for o in history['outputs']:
        for node_id in history['outputs']:
            node_output = history['outputs'][node_id]
            # 图片分支
            if 'images' in node_output:
                images_output = []
                for image in node_output['images']:
                    image_data = get_image(image['filename'], image['subfolder'], image['type'])
                    images_output.append(image_data)
                output_images[node_id] = images_output
            # 视频分支
            if 'videos' in node_output:
                videos_output = []
                for video in node_output['videos']:
                    video_data = get_image(video['filename'], video['subfolder'], video['type'])
                    videos_output.append(video_data)
                output_images[node_id] = videos_output

    print('获取图片完成')
    print(output_images)
    return output_images

# 解析工作流并获取图片
def parse_worflow(ws, prompt, seed, workflowfile):
    workflowfile = workflowfile
    print('workflowfile:'+workflowfile)
    with open(workflowfile, 'r', encoding="utf-8") as workflow_api_txt2gif_file:
        prompt_data = json.load(workflow_api_txt2gif_file)
        # 设置文本提示
        prompt_data["24"]["inputs"]["text"] = prompt

        return get_images(ws, prompt_data)

# 生成图像并显示
def generate_clip(prompt, seed, workflowfile, idx):
    try:
        print('seed:'+str(seed))
        ws = websocket.WebSocket()
        ws.connect("ws://{}/ws?clientId={}".format(server_address, client_id))
        images = parse_worflow(ws, prompt, seed, workflowfile)

        for node_id in images:
            for image_data in images[node_id]:
                from datetime import datetime

                # 获取当前时间，并格式化为 YYYYMMDDHHMMSS 的格式
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

                # 使用格式化的时间戳在文件名中
                GIF_LOCATION = "{}/{}_{}_{}.png".format(SageMaker_ComfyUI, idx, seed, timestamp)

                print('GIF_LOCATION:'+GIF_LOCATION)
                with open(GIF_LOCATION, "wb") as binary_file:
                    # 写入二进制文件
                    binary_file.write(image_data)

                show_gif(GIF_LOCATION)

                print("{} DONE!!!".format(GIF_LOCATION))
    except Exception as e:
        print(f"Error in generate_clip: {e}")


import pandas as pd

# 定义一个回调函数，当客户端连接时触发
def new_client(client, server):
    print(f"New client connected: {client['id']}")

# 定义一个回调函数，当接收到消息时触发
def message_received(client, server, message):
    print(f"Message from client {client['id']}: {message}")
    
    # 解析接收到的消息（假设是纯文本或 JSON 格式）
    try:
        data = json.loads(message)  # 如果前端发送的是 JSON 格式
        prompt = data.get("text", "")  # 获取语音转文字的内容
        print(f"Received prompt: {prompt}")

        # 调用生成图像的函数
        while True:
            threading.Thread(target=generate_clip, args=(prompt, seed, workflowfile, 1)).start()
            if prompt == "exit":
                print("Exiting...")
                break
            break  # 只启动一个线程，避免无限循环

    except json.JSONDecodeError:
        print("Invalid JSON received")
    except Exception as e:
        print(f"Error processing message: {e}")



# Example of reading from a CSV file
def read_prompts_from_csv(csv_file_path):
    df = pd.read_excel(csv_file_path)
    return df['prompt'].tolist()

# Execute the main function
if __name__ == "__main__":
    # 创建 WebSocket 服务器
    server = WebsocketServer(host="0.0.0.0", port=8081)
    server.set_fn_new_client(new_client)
    server.set_fn_message_received(message_received)
    print("WebSocket server is running on ws://0.0.0.0:8081")
    server.run_forever()

    #csv_file_path = 'prompt.xlsx'
    #prompts = read_prompts_from_csv(csv_file_path)

    #idx = 1
    #for prompt in prompts:
     #   generate_clip(prompt, seed, workflowfile, idx)
      #  idx += 1
    #生成图像并显示
    #prompt = input("请输入提示词：")
    #generate_clip(prompt, seed, workflowfile, 1)