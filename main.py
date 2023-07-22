import openai
import webview

openai.api_base = 'xxx'
openai.api_key = 'xxx'


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
        model='gpt-3.5-turbo',
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


if __name__ == '__main__':
    window = webview.create_window('FlexiAI', 'http://localhost:9000')
    window.expose(send_msg, load_config)

    webview.start(debug=True)
