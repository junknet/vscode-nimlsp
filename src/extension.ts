import * as vscode from "vscode";
import { NimlspContext } from "./nimlsp-context";
import path = require("path");
import os = require("os");
import fs = require("fs");
import cp = require("child_process");
import { rejects } from "node:assert";

const NIM_MODE: vscode.DocumentFilter = { language: "nim", scheme: "file" };

//  format use nimpretty  ;nimpretty should in your path!!!
class NimPretty implements vscode.DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    return new Promise((resolve, reject) => {
      var file = path.normalize(path.join(os.tmpdir(), "nimdirty.nim"));
      fs.writeFileSync(file, document.getText());
      let res = cp.spawnSync("nimpretty", [file]);
      if (res.status !== 0) {
        reject(res.error);
      } else {
        if (!fs.existsSync(file)) {
          reject(file + "file not found");
        } else {
          let content = fs.readFileSync(file, "utf-8");
          let range = document.validateRange(
            new vscode.Range(
              new vscode.Position(0, 0),
              new vscode.Position(1000000, 1000000)
            )
          );
          resolve([vscode.TextEdit.replace(range, content)]);
        }
      }
    });
  }
}

export async function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("nimlsp");
  context.subscriptions.push(outputChannel);

  const nimlspContext = new NimlspContext();
  context.subscriptions.push(nimlspContext);
  context.subscriptions.push(
    vscode.commands.registerCommand("nimlsp.activate", async () => {})
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("nimlsp.restart", async () => {
      nimlspContext.dispose();
      await nimlspContext.activate(outputChannel);
    })
  );
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      NIM_MODE,
      new NimPretty()
    )
  );

  await nimlspContext.activate(outputChannel);
}

export function deactivate() {}
