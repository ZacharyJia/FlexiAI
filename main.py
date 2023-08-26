import os
from re import L
import time
import base64
from tkinter import NO
from turtle import onclick

import openai
import webview
from dotenv import load_dotenv
import pyperclip
import keyboard
from win32 import win32gui, win32api
import win32.lib.win32con as win32con
from global_hotkeys import register_hotkeys, start_checking_hotkeys

load_dotenv()


openai.api_base = os.getenv('OPENAI_API_BASE')
openai.api_key = os.getenv('OPENAI_API_KEY')
model = os.getenv('MODEL_NAME', 'gpt-3.5-turbo')

print(openai.api_key)
print(openai.api_base)


def load_config():
    return {
        'apiKey': '1234567890',
    }


def send_msg(chat_id, history: list, msg):
    print('send_msg', history, msg)

    history.insert(0, {
        'role': 'system',
        'content': "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully.",
    })

    history.append({
        'role': 'user',
        'content': msg,
    })

    response = openai.ChatCompletion.create(
        model=model,
        messages=history,
        stream=True
    )

    for chunk in response:
        if 'content' in chunk['choices'][0]['delta']:
            content = chunk['choices'][0]['delta']['content']
            print(content, end='')
            content = content.replace('\n', '\\n').replace('\r', '\\r')
            window.evaluate_js(f'window.onChatMsg("{chat_id}", "{content}")')
    window.evaluate_js(f'window.onMsgEnd("{chat_id}")')
    print('msg end')


# 暴露给前端的接口，前端调用这个方法来获得当前剪贴板的内容
def get_clipboard():
    return pyperclip.paste()

def set_clipboard(content):
    print('set_clipboard', content)
    pyperclip.copy(content)

def hide_window():
    window.hide()

def replace_text(content):
    window.hide()
    time.sleep(0.1)
    pyperclip.copy(content)
    keyboard.send('ctrl+v')


URL = 'http://localhost:9000'


last_timestamp = 0

def show_window():
    time.sleep(0.1)
    window.show()
    time.sleep(0.1)
    # win32gui.ShowWindow(win32gui.FindWindow(None, "AnyHelper"), win32con.SW_SHOW)
    hwnd = win32gui.FindWindow(None, "AnyHelper")
    keyboard.press('alt')
    win32gui.SetForegroundWindow(hwnd)
    keyboard.release('alt')
    # win32gui.SetActiveWindow(hwnd)


    content = base64.b64encode(get_clipboard().encode('utf-8')).decode('utf-8')
    code = f'window.onClipboardUpdate("{content}")'
    print(code)
    window.evaluate_js(code)

def handle_shortcut():
    global last_timestamp
    if time.time() - last_timestamp < 0.5: # 0.5s内连续按下ctrl+c
        show_window()
    else:
        last_timestamp = time.time()



if __name__ == '__main__':
    window = webview.create_window(
        'AnyHelper', 
        'fe2/dist/spa/index.html',
        hidden=True,
        frameless=True,
        on_top=True,
        width=400,
        focus=True,
        )
    window.expose(send_msg, 
                  load_config, 
                  get_clipboard, 
                  set_clipboard, 
                  hide_window,
                  replace_text,
    )

    bindings = [
        ['control + c', None, handle_shortcut]
    ]


    # keyboard.add_hotkey('ctrl+c', handle_shortcut)
    register_hotkeys(bindings)
    start_checking_hotkeys()
    

    from infi.systray import SysTrayIcon
    menu_options = (
        ("显示AnyHelper窗口", None, lambda systray: show_window()),
        # ("设置", None, None),
    )
    systray = SysTrayIcon(
        "icon.ico",
        f"AnyHelper(当前模型: {model})",
        menu_options,
        on_quit=lambda systray: window.destroy(),
    )
    systray.start()

    webview.start(debug=False, http_server=True)

