import * as vscode from "vscode";
import {
  DIFF_DIR,
  KONVEYOR_SCHEME,
  KonveyorRepository,
} from "./konveyorRepository";
import { KonveyorSourceControl } from "./konveyorSourceControl";
import { KonveyorDocumentContentProvider } from "./konveyorDocumentContentProvider";
import * as path from "path";

const SOURCE_CONTROL_OPEN_COMMAND = "extension.source-control.open";

export async function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "konveyor-scm-poc" is now active!'
  );

  // TODO: handle multi-workspace scenario
  const workspaceFolder = vscode.workspace.workspaceFolders[0];
  const diffFolder = vscode.Uri.file(
    path.join(workspaceFolder.uri.fsPath, DIFF_DIR)
  );
  const projectRepository = new KonveyorRepository(diffFolder);
  const konveyorDocumentContentProvider = new KonveyorDocumentContentProvider(
    projectRepository
  );
  const konveyorSourceControl = new KonveyorSourceControl(
    context,
    workspaceFolder,
    projectRepository,
    diffFolder
  );

  konveyorSourceControl.onRepositoryChange(
    (suggestions) => ""
    // TODO: konveyorDocumentContentProvider.updated(suggestions)
  );
  context.subscriptions.push(konveyorSourceControl);

  const openCommand = vscode.commands.registerCommand(
    SOURCE_CONTROL_OPEN_COMMAND,
    (fiddleId?: string, workspaceUri?: vscode.Uri) => {
      //   tryOpenFiddle(context, fiddleId, workspaceUri);
    }
  );
  context.subscriptions.push(openCommand);

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      KONVEYOR_SCHEME,
      konveyorDocumentContentProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.source-control.refresh",
      async (sourceControlPane: vscode.SourceControl) => {
        konveyorSourceControl.refresh();
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.source-control.discard",
      async (sourceControlPane: vscode.SourceControl) => {
        konveyorSourceControl.resetFilesToCheckedOutVersion();
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.source-control.commit",
      async (sourceControlPane: vscode.SourceControl) => {
        konveyorSourceControl.commitAll();
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.source-control.checkout",
      async (sourceControl: KonveyorSourceControl, newVersion?: number) => {
        konveyorSourceControl.refresh();
      }
    )
  );
}
