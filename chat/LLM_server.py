import asyncio
import websockets
import json
import requests

OLLAMA_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "phi3"

# 存储每个客户端的对话历史
client_histories = {}

async def handle_client(websocket):
    # 为每个客户端分配独立历史
    client_histories[websocket] = []
    try:
        # 接收客户端消息
        async for message in websocket:
            data = json.loads(message)
            user_text = data.get("text", "")
            print(f"收到用户消息: {user_text}")

            # 添加用户消息到历史
            client_histories[websocket].append({"role": "user", "content": user_text})

            # 调用 Ollama 的 chat 接口（支持多轮对话）
            payload = {
                "model": OLLAMA_MODEL,
                "messages": client_histories[websocket]
            }
            try:
                response = requests.post(OLLAMA_URL, json=payload, timeout=60)
                response.raise_for_status()
                # 处理所有行，拼接完整回复
                ai_reply = ""
                for line in response.text.splitlines():
                    if line.strip():
                        result = json.loads(line)
                        content = result.get("message", {}).get("content", "")
                        ai_reply += content
            except Exception as e:
                ai_reply = f"模型调用出错: {e}"

            # 添加 AI 回复到历史
            client_histories[websocket].append({"role": "assistant", "content": ai_reply})

            # 返回 AI 回复给客户端
            await websocket.send(json.dumps({"response": ai_reply}))
            # 输出 AI 回复到控制台
            print(f"AI 回复: {ai_reply}")
    finally:
        # 客户端断开时清理历史
        client_histories.pop(websocket, None)

async def main():
    async with websockets.serve(handle_client, "localhost", 8082):
        print("WebSocket 服务器已启动，监听端口 8082...")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())