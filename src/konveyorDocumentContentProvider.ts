import {
  CancellationToken,
  TextDocumentContentProvider,
  Event,
  Uri,
  EventEmitter,
  Disposable,
} from "vscode";
import { Suggestions, KonveyorRepository } from "./konveyorRepository";
import * as fs from "fs/promises";

export class KonveyorDocumentContentProvider
  implements TextDocumentContentProvider, Disposable
{
  constructor(private projectRepository: KonveyorRepository) {}

  private _onDidChange = new EventEmitter<Uri>();

  get onDidChange(): Event<Uri> {
    return this._onDidChange.event;
  }

  dispose(): void {
    this._onDidChange.dispose();
  }

  async provideTextDocumentContent(
    uri: Uri,
    token: CancellationToken
  ): Promise<string> {
    if (token.isCancellationRequested) {
      return "Canceled";
    }

    const realUri = this.projectRepository.resolveKonveyorPath(uri);
    // read file content
    const content = await fs.readFile(realUri.fsPath, { encoding: "utf8" });
    return content;
  }
}
