# DVT `.build` Configuration File Generator

> **Requirements**: VS Code >= **1.67.2**

The DVT Build Configuration File Generator is a VS Code extension that simplifies the creation of a `.build` file for [DVT](https://marketplace.visualstudio.com/items?itemName=amiq.dvt) projects. With this extension, you can generate a `.build` file using a single command.

## Features

- Automatic detection of `*.log` files within the current `tb`'s build directory, making it easy to select the desired files. It is possible to customize the locations where the extension looks for log files.
- Ability to manually select a `*.log` file for generating a `.build` file.

## Supported Log Types

Currently only `xrun.log` log files are supported. If you using another compiler you can open issue with a log file format example.

## Usage

To generate a `.build` file, follow these steps:

- Open a DVT project in VS Code.
- Open the command palette (<kbd>cmd/ctrl</kbd> + <kbd>shift</kbd> + <kbd>P</kbd>) and search for `Generate .build file...`.
- Choose a build from the list file you want to use for generating the `.build` file, or select a log file manually.
Requirements

To use this extension, you must have the [DVT extension](https://marketplace.visualstudio.com/items?itemName=amiq.dvt) installed.

## Acknowledgements

This extension was inspired by the Eclipse extension created by Alon Margalit.

![Eclipse Extension Button](https://github.com/hzisman/dvt-build-configuration-file-generator/blob/main/images/original-eclipse-extension-button.jpeg?raw=true)

*The button of the original Eclipse extension*

## Contributing

Contributions are welcome! If you would like to contribute to this project, please fork the [repository](https://github.com/hzisman/dvt-build-configuration-file-generator.git) and submit a pull request.
