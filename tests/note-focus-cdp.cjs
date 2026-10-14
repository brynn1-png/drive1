const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const viewportWidth = Number(process.argv[2]) || 1280;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-note-focus-'));
const pageUrl = pathToFileURL(path.join(__dirname, 'note-editor-smoke.html')).href + '?focus-test';
const child = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, `--window-size=${viewportWidth},800`, pageUrl,
], { windowsHide: true, stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  let ws;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
    if (!fs.existsSync(portFile)) throw new Error('Chrome debugging port did not start');
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const page = pages.find((item) => item.type === 'page' && item.url.includes('focus-test'));
    if (!page) throw new Error('Focus test page did not open');

    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let nextId = 0;
    const pending = new Map();
    ws.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id);
      message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };

    for (let i = 0; i < 50 && await evaluate('document.getElementById("result")?.textContent') !== 'READY'; i++) await sleep(100);
    if (await evaluate('document.getElementById("result")?.textContent') !== 'READY') throw new Error('Note did not open');
    const rect = await evaluate('(() => { const r = document.getElementById("note-title-input").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()');
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
    await sleep(100);
    const focused = await evaluate('document.activeElement?.id');
    await send('Input.insertText', { text: ' renamed' });
    const title = await evaluate('document.getElementById("note-title-input").value');
    const body = await evaluate('document.querySelector("#note-textarea .ql-editor").textContent');
    if (focused !== 'note-title-input' || title !== 'Original title renamed' || body !== 'Note body') {
      throw new Error(`Title click focused ${focused || 'the note body'}; title=${title}; body=${body}`);
    }
    process.stdout.write('PASS title click receives typed text\n');
    await send('Browser.close');
  } finally {
    if (ws?.readyState === WebSocket.OPEN) ws.close();
    if (child.exitCode === null) {
      child.kill();
      await Promise.race([new Promise((resolve) => child.once('exit', resolve)), sleep(2000)]);
    }
    const tempRoot = path.resolve(os.tmpdir());
    const resolvedProfile = path.resolve(profile);
    if (path.dirname(resolvedProfile) === tempRoot && path.basename(resolvedProfile).startsWith('codex-note-focus-')) {
      try { fs.rmSync(resolvedProfile, { recursive: true, force: true }); } catch { /* Chrome may still be releasing its profile. */ }
    }
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
