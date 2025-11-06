// import * as monaco from '@codingame/monaco-vscode-editor-api';
import { MonacoEditorReactComp } from "@typefox/monaco-editor-react";
import type { CodeContent, EditorAppConfig, TextContents } from "monaco-languageclient/editorApp";
import type { LanguageClientConfig } from "monaco-languageclient/lcwrapper";
import type { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import { configureDefaultWorkerFactory } from "monaco-languageclient/workerFactory";
import { useState } from "react";
import { LogLevel } from "vscode";
import { BrowserMessageReader, BrowserMessageWriter } from "vscode-jsonrpc/browser";
import text from "./langium/example.statemachine?raw";
import workerUrl from "./langium/worker?worker&url";

import statemachineLanguageConfig from "../language-configuration.json?raw";
import responseStatemachineTm from "./langium/syntaxes/statemachine.tmLanguage.json?raw";

const worker = new Worker(workerUrl, {
    type: "module",
    name: "Statemachine Server Regular",
});
const reader = new BrowserMessageReader(worker);
const writer = new BrowserMessageWriter(worker);
reader.listen((message) => {
    console.log("Received message from worker:", message);
});

const createLanguageClientConfig = (): LanguageClientConfig => ({
    languageId: "statemachine",
    clientOptions: {
        documentSelector: ["statemachine"],
    },
    connection: {
        options: {
            $type: "WorkerDirect",
            worker: worker,
        },
        messageTransports: {reader, writer},
    },
});

const createVscodeApiConfig = (): MonacoVscodeApiConfig => {
    const extensionFilesOrContents = new Map<string, string | URL>();
    extensionFilesOrContents.set(`configuration.json`, statemachineLanguageConfig);
    extensionFilesOrContents.set(`grammar.json`, responseStatemachineTm);

    return {
        $type: "extended",
        viewsConfig: {
            $type: "EditorService",
        },
        logLevel: LogLevel.Debug,
        monacoWorkerFactory: configureDefaultWorkerFactory,
        userConfiguration: {
            json: JSON.stringify({
                "workbench.colorTheme": "Default Dark Modern",
            }),
        },
        extensions: [
            {
                config: {
                    name: "statemachine-example",
                    publisher: "",
                    version: "1.0.0",
                    engines: {
                        vscode: "*",
                    },
                    contributes: {
                        languages: [
                            {
                                id: "statemachine",
                                extensions: [".statemachine"],
                                configuration: `configuration.json`,
                            },
                        ],
                        grammars: [
                            {
                                language: "statemachine",
                                scopeName: "source.statemachine",
                                path: `grammar.json`,
                            },
                        ],
                    },
                },
                filesOrContents: extensionFilesOrContents,
            },
        ],
    };
};

const createEditorAppConfig = (codeContent: CodeContent): EditorAppConfig => ({
    codeResources: {
        modified: codeContent,
    },
});

const App = () => {
    const [testState, setTestState] = useState<string>(text);
    const languageClientConfig = createLanguageClientConfig();
    const vscodeApiConfig = createVscodeApiConfig();
    const editorAppConfig = createEditorAppConfig({
        uri: "/workspace/example.statemachine",
        text: testState,
    });

    const onTextChanged = (textChanges: TextContents) =>
      setTestState(textChanges.modified as string);

    return (
        <>
            <button
                style={{background: "purple"}}
                onClick={() => setTestState(testState + "\n // comment")}
            />

            <MonacoEditorReactComp
                style={{height: "50vh", width: "100vh"}}
                vscodeApiConfig={vscodeApiConfig}
                editorAppConfig={editorAppConfig}
                languageClientConfig={languageClientConfig}
                onTextChanged={onTextChanged}
            />
        </>
    );
};

export default App;

