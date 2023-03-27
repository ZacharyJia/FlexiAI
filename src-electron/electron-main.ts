import {app, BrowserWindow, ipcMain, nativeTheme} from 'electron';
import path from 'path';
import os from 'os';
import * as fs from 'fs';
import {Configuration, OpenAIApi} from 'openai';


// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
  if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(
      path.join(app.getPath('userData'), 'DevTools Extensions')
    );
  }
} catch (_) {}

let mainWindow: BrowserWindow | undefined;

let config = {
  apiKey: '',
};

function shouldUsePlugins(msg: string) {
  const configuration = new Configuration({
    apiKey: config.apiKey,
  });

  const prompt = `
你需要根据用户的问题，判断用户的意图，进而判断是否需要使用插件。问题会放在【】中。
可以使用的插件: [{"name":"mem","description":"Plugin for searching through the user's documents (such as files, emails, and more) to find answers to questions and retrieve relevant information. Use it whenever a user asks something that might be found in their personal information, or asks you to save information for later.","methods":[{"name":"set","param":"content"},{"name":"get","param":"keyword"}]},{"name":"calendar","description":"Plugin for recording and querying user schedules, including datetimes and events.","methods":[{"name":"add","param":{"date":"yyyy/MM/dd","time":"hh:mm:ss", "event":"event name"}},{"name":"query","param":{"date":"yyyy/MM/dd"}}]}]

如果需要使用插件，输出以下格式：
{"name": "plugin name", "method": "method you would like to use", "param": "parameter of this method" }

如果不需要，输出：{"name": "none"}
例如：
Q: 【我的宠物叫什么？】
A: {"name": "mem", "method": "get", "param":"pet"}
Q: 【帮我解释一下黑洞】
A: {"name": "none"}
现在开始：
Q: 【${msg}】`

  const openai = new OpenAIApi(configuration);
  return openai.createChatCompletion({
    model: 'gpt-3.5-turbo-0301',
    messages: [
      {'role': 'system', 'content': 'You are a helpful assistant.'},
      {'role': 'user', 'content': prompt},
    ],
  });
}

interface CalEvent {
  date: string;
  time: string;
  event: string;
}

const calendarData = new Map<string, CalEvent[]>();
function calendarPlugin(method: string, param: any) {
  if (method === 'add') {
    const { date, time, event } = param;
    if (!calendarData.get(date)) {
      calendarData.set(date, []);
    }
    calendarData.get(date)?.push({ date, time, event });
    return '已添加';
  } else if (method === 'query') {
    const { date } = param;
    return `${date}日程如下: ${JSON.stringify(calendarData.get(date))}` || `${date} 没有事件`;
  } else {
    return '不支持的方法';
  }
}

// 解析一个混合字符串中，第一个合法的json字符串
function extractFirstJson(str: string) {
  const jsonStart = str.indexOf('{'); // 查找第一个左大括号的位置
  let jsonEnd = str.indexOf('}', jsonStart); // 查找与左大括号匹配的右大括号位置
  while (jsonStart !== -1 && jsonEnd !== -1) { // 循环直到找到有效JSON对象或字符串结束
    try {
      const jsonObj = JSON.parse(str.slice(jsonStart, jsonEnd + 1)); // 尝试解析JSON对象
      return jsonObj; // 如果解析成功，返回该对象
    } catch (err) {
      // 解析失败，继续查找下一个左大括号和右大括号的位置
      // jsonStart = str.indexOf('{', jsonEnd);
      jsonEnd = str.indexOf('}', jsonEnd+1);
    }
  }
  return null; // 没有找到有效的JSON对象，返回null
}

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  mainWindow.loadURL(process.env.APP_URL);

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });

  ipcMain.on('loadConfig', (event) => {
    // 从配置文件加载，如果没有则使用默认配置
     const configFile = path.join(app.getPath('home'), '.flexiAI', 'config.json');
     if (fs.existsSync(configFile)) {
       config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
       event.returnValue = config;
     } else {
       event.returnValue = {
         apiKey: '',
       };
     }
  });

  ipcMain.on('saveConfig', (event, newConfig) => {
    console.log(newConfig)
    // 保存配置到配置文件
    const configFolder = path.join(app.getPath('home'), '.flexiAI');
    if (!fs.existsSync(configFolder)) {
      fs.mkdirSync(configFolder);
    }
    fs.writeFileSync(path.join(configFolder, 'config.json'), JSON.stringify(newConfig));
    config = newConfig;
    mainWindow?.webContents.send('NotifySaveConfig', {
      status: 'success',
      msg: '保存成功',
    })
  });

  ipcMain.on('sendMsg', async (event, msg, history) => {
    // todo: 异常处理
    console.log(history);
    console.log('判断是否应该使用插件')

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    shouldUsePlugins(msg).then(async (res) => {
      console.log(res.data.choices[0]);
      if (res.data.choices[0].message?.content) {
        const data = extractFirstJson(res.data.choices[0].message?.content);
        if (!data || data.name === 'none') {
          console.log('不需要使用插件');
        } else {
          console.log('需要使用插件');
          let pluginMsg = '';
          if (data.name === 'calendar') {
            pluginMsg = calendarPlugin(data.method, data.param);
          } else {
            pluginMsg = '之前的聊天提过：【我的书架上有三本书，童年，在人间和我的大学】';
          }
          console.log(`插件消息：${pluginMsg}`);
          msg = `Context: ${pluginMsg}\nQ: ${msg}`
        }
      }

      console.log('发送消息');

      const configuration = new Configuration({
        apiKey: config.apiKey,
      });

      const openai = new OpenAIApi(configuration);

      try {
        const res = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo-0301',
          messages: [
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': '你扮演一个人类助手，助手干完的事情会告诉你，你只需要根据上下文回复主人的话即可。'},
            ...history,
            {'role': 'user', 'content': msg},
          ],
          stream: true,
        }, {responseType: 'stream'});

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        res.data.on('data', (chunk: any) => {
          const lines = chunk.toString().split('\n').filter((line: string) => line.trim() !== '');
          for (const line of lines) {
            const message = line.replace(/^data: /, '');
            if (message === '[DONE]') {
              mainWindow?.webContents.send('NotifyChatResponseDone');
              return; // Stream finished
            }
            try {
              // 有消息返回
              const parsed = JSON.parse(message);
              if (parsed.choices[0].delta.content !== undefined) {
                mainWindow?.webContents.send('NotifyChatResponseDelta', {
                  content: parsed.choices[0].delta.content,
                });
              }
            } catch (error) {
              console.error('Could not JSON parse stream message', message, error);
            }
          }
        });
      } catch (error: any) {
        if (error.response?.status) {
          console.error(error.response.status, error.message);
          error.response.data.on('data', (data: any) => {
            const message = data.toString();
            try {
              const parsed = JSON.parse(message);
              console.error('An error occurred during OpenAI request: ', parsed);
            } catch (error) {
              console.error('An error occurred during OpenAI request: ', message);
            }
          });
        } else {
          console.error('An error occurred during OpenAI request', error);
        }
      }
    });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    createWindow();
  }
});
