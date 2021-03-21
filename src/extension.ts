import * as vscode from 'vscode';
import { NimdContext } from './nimd-context';



export async function activate(context: vscode.ExtensionContext) {
	const outputChannel = vscode.window.createOutputChannel('nimd');
	context.subscriptions.push(outputChannel);
	
	const nimdContext = new NimdContext;
	context.subscriptions.push(nimdContext);
	context.subscriptions.push(vscode.commands.registerCommand('nimd.activate', async () => { }));
	context.subscriptions.push(vscode.commands.registerCommand('nimd.restart', async () => {
		nimdContext.dispose();
		await nimdContext.activate(outputChannel);
	}));
	
	await nimdContext.activate(outputChannel);
}

export function deactivate() {}
