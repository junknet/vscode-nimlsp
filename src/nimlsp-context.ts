import { copyFileSync } from 'node:fs';
import * as vscode from 'vscode';
import * as vscodelc from 'vscode-languageclient/node';

class NimlspLanguageClient extends vscodelc.LanguageClient {
  // Override the default implementation for failed requests. The default
  // behavior is just to log failures in the output panel, however output panel
  // is designed for extension debugging purpose, normal users will not open it,
  // thus when the failure occurs, normal users doesn't know that.
  //
  // For user-interactive operations (e.g. applyFixIt, applyTweaks), we will
  // prompt up the failure to users.

  handleFailedRequest<T>(type: vscodelc.MessageSignature, error: any,
                         token: vscode.CancellationToken|undefined,
                         defaultValue: T): T {
    if (error instanceof vscodelc.ResponseError)
      {vscode.window.showErrorMessage(error.message);}
    return super.handleFailedRequest(type, token, error, defaultValue);
  }
}

class EnableEditsNearCursorFeature implements vscodelc.StaticFeature {
  initialize() {}
  fillClientCapabilities(capabilities: vscodelc.ClientCapabilities): void {
    const extendedCompletionCapabilities: any =
        capabilities.textDocument.completion;
    extendedCompletionCapabilities.editsNearCursor = true;
  }
  dispose() {}
}

export class NimlspContext implements vscode.Disposable {
  subscriptions: vscode.Disposable[] = [];
  client: NimlspLanguageClient;

  async activate(outputChannel: vscode.OutputChannel) {
    const nimlspPath = vscode.workspace.getConfiguration('nimlsp').get<string>('path');
    const nimlspArgs = vscode.workspace.getConfiguration('nimlsp').get<string[]>('arguments');
    const nimlsp: vscodelc.Executable = {
      command: nimlspPath,
      args: nimlspArgs,
      options: {cwd:vscode.workspace.workspaceFolders[0].uri.fsPath}
    };
    const serverOptions: vscodelc.ServerOptions = nimlsp;

    const clientOptions: vscodelc.LanguageClientOptions = {
      // Register the server for c-family and cuda files.
      documentSelector: [
        {scheme: 'file', language: 'nim'},
      ],
      outputChannel: outputChannel,
      revealOutputChannelOn: vscodelc.RevealOutputChannelOn.Never,

 
      // See https://github.com/microsoft/language-server-protocol/issues/898
      middleware: {
        provideCompletionItem: async (document, position, context, token,
                                      next) => {
          let list = await next(document, position, context, token);
          // if (Array.isArray(list)) {
          //   list[0].label = "xxx";
          //   list[0].insertText = new vscode.SnippetString("let $1 = $2");

          // }
          // console.log(list);
          return list;
          
          // return list;
          // let items = (Array.isArray(list) ? list : list.items).map(item => {
            // let prefix = document.getText(
              // new vscode.Range((item.range as vscode.Range).start, position));
            // if (prefix)
            // {item.filterText = prefix + '_' + item.filterText;}
            // return item;
          // });
          // return new vscode.CompletionList(items, /*isIncomplete=*/ true);
        },
        provideWorkspaceSymbols: async (query, token, next) => {
          let symbols = await next(query, token);
          return symbols.map(symbol => {
            // Only make this adjustment if the query is in fact qualified.
            // Otherwise, we get a suboptimal ordering of results because
            // including the name's qualifier (if it has one) in symbol.name
            // means vscode can no longer tell apart exact matches from
            // partial matches.
            if (query.includes('::')) {
              if (symbol.containerName)
                {symbol.name = `${symbol.containerName}::${symbol.name}`;}
              // Clean the containerName to avoid displaying it twice.
              symbol.containerName = '';
            }
            return symbol;
          });
        },
      },
    };
    this.client = new NimlspLanguageClient('Nim Language Server',
                                           serverOptions, clientOptions);
    this.client.clientOptions.errorHandler =
        this.client.createDefaultErrorHandler(
            // max restart count
            3);
    this.client.registerFeature(new EnableEditsNearCursorFeature);
    this.subscriptions.push(this.client.start());
    console.log('Nimd Language Server is now active!');
  }

  dispose() {
    this.subscriptions.forEach((d) => { d.dispose(); });
    this.subscriptions = [];
  }
}
