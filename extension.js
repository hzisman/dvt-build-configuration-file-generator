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
		const selectManuallyOption = 'Select run.log file manually...'
		
		const selectedOption = (
			builds.length === 0
			? selectManuallyOption 
			: await vscode.window.showQuickPick(
				[...builds.map(b => b.build), selectManuallyOption],
				{
					title: 'Select build',
					matchOnDescription: true,
					matchOnDetail: true,
					placeHolder: 'Select build',
					canPickMany: false,
				},
			)
		);

		let logFilePath;
		if (selectedOption === selectManuallyOption) {
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
			logFilePath = builds[selectedOption];
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