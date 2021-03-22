import * as vscode from 'vscode';
import { NimlspContext } from './nimlsp-context';



export async function activate(context: vscode.ExtensionContext) {
	const outputChannel = vscode.window.createOutputChannel('nimlsp');
	context.subscriptions.push(outputChannel);
	
	const nimlspContext = new NimlspContext;
	context.subscriptions.push(nimlspContext);
	context.subscriptions.push(vscode.commands.registerCommand('nimlsp.activate', async () => { }));
	context.subscriptions.push(vscode.commands.registerCommand('nimlsp.restart', async () => {
		nimlspContext.dispose();
		await nimlspContext.activate(outputChannel);
	}));
	
	await nimlspContext.activate(outputChannel);
}

export function deactivate() {}
