import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import * as os from 'os';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {

  const disposable = vscode.workspace.onDidChangeTextDocument((event) => {
    for (const change of event.contentChanges) {
      if (contiene14(event.document, change)) {
        mostrarPanel(context);
        break;
      }
    }
  });

  context.subscriptions.push(disposable);
}

function contiene14(
  document: vscode.TextDocument,
  change: vscode.TextDocumentContentChangeEvent
): boolean {
  if (change.text.includes('14')) {
    return true;
  }

  if (change.text.length !== 1) {
    return false;
  }

  const pos = change.range.start;
  const lineText = document.lineAt(pos.line).text;

  if (change.text === '4') {
    const prevChar = pos.character > 0 ? lineText[pos.character - 1] : '';
    return prevChar === '1';
  }

  if (change.text === '1') {
    const nextChar = lineText[pos.character + 1] ?? '';
    return nextChar === '4';
  }

  return false;
}

function mostrarPanel(context: vscode.ExtensionContext) {
  const imagenPath = path.join(context.extensionPath, 'media', 'imagen14.png');
  const audioPath = path.join(context.extensionPath, 'media', 'audio14.mp3');

  if (!fs.existsSync(imagenPath) || !fs.existsSync(audioPath)) {
    vscode.window.showErrorMessage(`Faltan archivos: imagen14.png y audio14.mp3 en media/`);
    return;
  }

  if (panel) {
    reproducirAudio(audioPath);
    return;
  }

  panel = vscode.window.createWebviewPanel(
    'tienes14',
    'Activa cam 😈',
    { viewColumn: vscode.ViewColumn.Active, preserveFocus: true },
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
      retainContextWhenHidden: true
    }
  );

  const imageUri = panel.webview.asWebviewUri(vscode.Uri.file(imagenPath));
  const audioUri = panel.webview.asWebviewUri(vscode.Uri.file(audioPath));

  panel.webview.html = getWebviewContent(panel.webview, imageUri);
  reproducirAudio(audioPath);

  // Escucha el mensaje "cerrar" que manda el webview al terminar el fade-out
  panel.webview.onDidReceiveMessage((msg) => {
    if (msg.command === 'cerrar' && panel) {
      panel.dispose();
    }
  }, null, context.subscriptions);

  panel.onDidDispose(() => {
    panel = undefined;
  }, null, context.subscriptions);
}

function reproducirAudio(audioPath: string) {
  const platform = os.platform();
  if (platform === 'win32') {
    // Escapa las barras para VBScript
    const escaped = audioPath.replace(/\\/g, '\\\\');
    const vbs = `Set p = CreateObject("WMPlayer.OCX.7")\r\np.URL = "${escaped}"\r\np.controls.play\r\nWScript.Sleep 15000\r\n`;
    const tmpVbs = path.join(os.tmpdir(), 'tienes14_play.vbs');
    fs.writeFileSync(tmpVbs, vbs);
    spawn('cscript', ['//NoLogo', '//B', tmpVbs], {
      detached: true,
      stdio: 'ignore'
    }).unref();
  } else if (platform === 'darwin') {
    spawn('afplay', [audioPath], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn('paplay', [audioPath], { detached: true, stdio: 'ignore' }).unref();
  }
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function getWebviewContent(webview: vscode.Webview, imageUri: vscode.Uri): string {
  const nonce = getNonce();
  const csp = webview.cspSource; 

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp} data:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>¡Tienes 14!</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0d0d0d;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
    }
    img {
      max-width: 100%;
      max-height: 100vh;
      object-fit: contain;
      animation: fadeIn 0.4s ease-out forwards;
    }
    body.saliendo img {
      animation: fadeOut 1s ease-in forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
  </style>
</head>
<body>
  <img src="${imageUri}" alt="14" />

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    function iniciarCierre() {
      document.body.classList.add('saliendo');
      setTimeout(() => vscode.postMessage({ command: 'cerrar' }), 1000);
    }

    setTimeout(iniciarCierre, 1000);

    document.body.addEventListener('click', iniciarCierre);
  </script>
</body>
</html>`;
}

export function deactivate() {}
