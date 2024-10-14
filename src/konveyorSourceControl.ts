import * as vscode from "vscode";
import {
  KonveyorRepository,
  Suggestions,
  KONVEYOR_SCHEME,
} from "./konveyorRepository";

export class KonveyorSourceControl implements vscode.Disposable {
  private konveyorScm: vscode.SourceControl;
  private changedResources: vscode.SourceControlResourceGroup;
  private latestSuggestionVersion: number = Number.POSITIVE_INFINITY; // until actual value is established
  private _onRepositoryChange = new vscode.EventEmitter<Suggestions>();
  private timeout?: NodeJS.Timeout;
  private fiddle: Suggestions;

  constructor(
    context: vscode.ExtensionContext,
    private readonly workspaceFolder: vscode.WorkspaceFolder,
    private readonly projectRepository: KonveyorRepository,
    private readonly diffFolder: vscode.Uri,
    suggestions?: Suggestions
  ) {
    this.konveyorScm = vscode.scm.createSourceControl(
      KONVEYOR_SCHEME,
      "Konveyor fix suggestions",
      workspaceFolder.uri
    );
    this.changedResources = this.konveyorScm.createResourceGroup(
      "workingTree",
      "Suggested fixes"
    );
    this.konveyorScm.quickDiffProvider = this.projectRepository;
    this.konveyorScm.inputBox.placeholder = "Message is ignored in this PoC";

    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(this.diffFolder, "*.*")
    );

    fileSystemWatcher.onDidChange(
      (uri) => this.onResourceChange(uri),
      context.subscriptions
    );
    fileSystemWatcher.onDidCreate(
      (uri) => this.onResourceChange(uri),
      context.subscriptions
    );
    fileSystemWatcher.onDidDelete(
      (uri) => this.onResourceChange(uri),
      context.subscriptions
    );

    context.subscriptions.push(this.konveyorScm);
    context.subscriptions.push(fileSystemWatcher);

    if (suggestions) {
      this.setSuggestions(suggestions);
    }
  }

  private refreshStatusBar() {
    this.konveyorScm.statusBarCommands = [
      {
        command: "extension.source-control.checkout",
        arguments: [this],
        title: `↕ Konveyor`,
        tooltip: "Request new suggestions.",
      },
    ];
  }

  async commitAll(): Promise<void> {
    // TODO: apply suggestions to current code
    console.log("Not implemented: commitAll");
  }

  resetFilesToCheckedOutVersion(): void {
    // TODO: reset back to original suggestions (if modified by hand)
    console.log("Not implemented: resetFilesToCheckedOutVersion");
  }

  public setSuggestions(newFiddle: Suggestions, overwrite: boolean = true) {
    // TODO: take in-memory representation and write as files
    console.log("Not implemented: setSuggestions");
  }

  get onRepositoryChange(): vscode.Event<Suggestions> {
    return this._onRepositoryChange.event;
  }

  onResourceChange(uri: vscode.Uri): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => this.tryUpdateChangedGroup(uri), 500);
  }

  async tryUpdateChangedGroup(uri: vscode.Uri): Promise<void> {
    try {
      await this.updateChangedGroup(uri);
    } catch (ex) {
      vscode.window.showErrorMessage(ex);
    }
  }

  async updateChangedGroup(_changedUri: vscode.Uri): Promise<void> {
    // for simplicity we ignore which document was changed in this event and scan all of them
    const uris =
      await this.projectRepository.provideSourceControlledResources();

    const resourceStates: vscode.SourceControlResourceState[] = uris.map(
      (uri) => this.toSourceControlResourceState(uri)
    );

    this.changedResources.resourceStates = resourceStates;

    // the number of modified resources needs to be assigned to the SourceControl.count filed to let VS Code show the number.
    this.konveyorScm.count = this.changedResources.resourceStates.length;
  }

  toSourceControlResourceState(
    suggestionsUri: vscode.Uri,
    deleted: boolean = false
  ): vscode.SourceControlResourceState {
    const docUri = this.projectRepository.provideOriginalResource(
      suggestionsUri,
      null
    );

    const command: vscode.Command = !deleted
      ? {
          title: "Show suggestions",
          command: "vscode.diff",
          arguments: [docUri, suggestionsUri, `Current code ↔ Suggestions`],
          tooltip: "Diff suggested changes",
        }
      : null;

    const resourceState: vscode.SourceControlResourceState = {
      resourceUri: docUri,
      command: command,
      decorations: {
        strikeThrough: deleted,
        tooltip: "File was locally deleted.",
      },
    };

    return resourceState;
  }

  async refresh(): Promise<void> {
    // TODO: request new suggestions
    this.onResourceChange(this.diffFolder);
    console.log("Re-read local files");
    this.refreshStatusBar();
  }

  dispose() {
    this._onRepositoryChange.dispose();
    this.konveyorScm.dispose();
  }
}
