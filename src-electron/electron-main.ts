import {app, BrowserWindow, ipcMain, nativeTheme} from 'electron';
import path from 'path';
import os from 'os';
import * as fs from 'fs';
import { Configuration, OpenAIApi } from 'openai';


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

  ipcMain.on('loadConfig', (event, args) => {
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

    const configuration = new Configuration({
      apiKey: config.apiKey,
    });

    const openai = new OpenAIApi(configuration);

    console.log('发送消息');

    try {
      const res = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {'role': 'system', 'content': 'You are a helpful assistant.'},
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
