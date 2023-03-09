const vscode = require('vscode');
const { genrateBuildConfigFile } = require('./generate-build-config-file');
const { getBuildLogs } = require('./get-builds');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('dvt-build-configuration-file-generator.generatebuildfile', async () => {

		const workingDirectory = vscode.workspace.workspaceFolders[0].uri.fsPath;

		const builds = await getBuildLogs(workingDirectory);
		const selectManuallyOption = { label: 'Select run.log file manually...' };
		
		const selectedOption = (
			Object.keys(builds).length === 0
			? selectManuallyOption 
			: await vscode.window.showQuickPick(
				[
					{
						label: 'Existing Builds',
						kind: vscode.QuickPickItemKind.Separator
					},
					...Object.keys(builds).map(label => ({ label })),
					{
						label: 'Select Manually',
						kind: vscode.QuickPickItemKind.Separator
					},
					selectManuallyOption,
				],
				{
					title: 'Select Build',
					matchOnDescription: true,
					matchOnDetail: true,
					placeHolder: 'Select Build',
					canPickMany: false,
				},
			)
		);

		if (selectedOption === undefined) return;

		let logFilePath;
		if (selectedOption.label === selectManuallyOption.label) {
			const [logFile] = await vscode.window.showOpenDialog({
				defaultUri: vscode.Uri.parse(workingDirectory),
				openLabel: 'Select',
				canSelectMany: false,
				filters: { 
					'Log File': ["run.log"], 
					'All Files': ["*"],
				},
			});
			logFilePath = logFile.fsPath;
		} else {
			logFilePath = builds[selectedOption.label];
		}
		
		const buildConfigFileName = await vscode.window.showInputBox({
            placeHolder: 'Build configuration file name',
        });

		await genrateBuildConfigFile(logFilePath, workingDirectory, buildConfigFileName);

		await vscode.window.showInformationMessage(`${buildConfigFileName}.build file generated successfully!`);
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}