const vscode = require('vscode');
const { generateBuildConfigFile } = require('./src/generate-build-config-file');
const { getLogs } = require('./src/get-logs');

/**
 * A function that prompts the user to select a log file from a list of existing logs or to select one manually.
 * @async
 * @param {string} workingDirectory - The path to the working directory.
 * @param {Object[]} logs - An array of log objects to choose from.
 * @param {string} logs[].displayName - The display name of the log file.
 * @param {string} logs[].path - The absolute path of the log file.
 * @param {boolean} showFullPath - Controls wheather or not to display for each log its full path
 * @returns {Promise<string|undefined>} - The path of the selected log file or undefined if none was selected.
 */
async function selectLogFile(workingDirectory, logs, showFullPath) {
    const selectManuallyOption = { label: 'Select log file manually...' };

    const selectedOption = await vscode.window.showQuickPick(
        [
            {
                label: 'Existing logs',
                kind: vscode.QuickPickItemKind.Separator,
            },
            ...logs.map(log => ({ 
                label: log.displayName, 
                ...(showFullPath ? { detail: log.path } : {}),
            })),
            {
                label: 'Select Manually',
                kind: vscode.QuickPickItemKind.Separator,
            },
            selectManuallyOption,
        ],
        {
            title: 'Select Build',
            matchOnDescription: true,
            matchOnDetail: true,
            placeHolder: 'Filter',
            canPickMany: false,
        },
    );

    if (selectedOption === undefined) return undefined;

    if (selectedOption.label === selectManuallyOption.label) {
        const logFiles = await vscode.window.showOpenDialog({
            defaultUri: vscode.Uri.parse(workingDirectory),
            openLabel: 'Select',
            canSelectMany: false,
            filters: { 
                'Log File': ["*.log"], 
                'All Files': ["*"],
            },
        });
        if (logFiles === undefined) return undefined;
        return logFiles[0].fsPath;
    } else {
        return logs.find(log => log.displayName == selectedOption.label).path;
    }
}

/**
 * A function that prompts the user to input a build configuration file name.
 * @async
 * @function selectBuildConfigFileName
 * @returns {Promise<string|undefined>} The name of the build configuration file or undefined if no name was provided.
 */
async function selectBuildConfigFileName() {
    const userInput = await vscode.window.showInputBox({
        placeHolder: 'Build configuration file name',
    });
    
    return userInput === '' ? 'default': userInput;
}

/**
 * Activates the extension and registers the dvt-build-configuration-file-generator.generatebuildfile command.
 * @async
 * @function activate
 * @param {Object} context - The context in which the extension is running.
 */
async function activate(context) {
    const disposable = vscode.commands.registerCommand('dvt-build-configuration-file-generator.generatebuildfile', async () => {
        const workingDirectory = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const config = vscode.workspace.getConfiguration('dvt-build-configuration-file-generator');
        
		const searchLocations = config.get('searchLocations');
        const excludeSearchLocations = config.get('excludeSearchLocations')
        const logs = await getLogs(workingDirectory, searchLocations, excludeSearchLocations);

        const showFullPath = config.get('showFullPath');
        const logFilePath = await selectLogFile(workingDirectory, logs, showFullPath);
        if (logFilePath === undefined) return;

        const buildConfigFileName = await selectBuildConfigFileName();
        if (buildConfigFileName === undefined) return;

        try {
            await generateBuildConfigFile(logFilePath, workingDirectory, buildConfigFileName);
            vscode.window.showInformationMessage(`${buildConfigFileName}.build file generated successfully!`);
            await vscode.commands.executeCommand('dvt.setCurrentBuildConfiguration');
        } catch (error) {
            await vscode.window.showErrorMessage(`Error generating build configuration file: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
