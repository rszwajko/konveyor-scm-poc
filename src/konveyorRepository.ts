import { QuickDiffProvider, Uri, CancellationToken, workspace } from "vscode";
import * as path from "path";
import * as fs from "fs/promises";

export const KONVEYOR_SCHEME = "konveyor";
export const DIFF_DIR = ".vscode/konveyor/diff";

//TODO: in-memory version
export class Suggestions {
  constructor(public version: number, public data: Record<string, string>) {}
}

export class KonveyorRepository implements QuickDiffProvider {
  constructor(private workspaceFolder: Uri) {}

  // konveyor:/repo/src/foo/bar.java -> file:/repo/src/foo/bar.java
  provideOriginalResource?(uri: Uri, token: CancellationToken): Uri {
    return Uri.from({ ...uri, scheme: "file" });
  }

  async provideSourceControlledResources(): Promise<Uri[]> {
    const files = await fs.readdir(this.workspaceFolder.fsPath, {
      withFileTypes: true,
      recursive: true,
    });
    // file:/repo/.vscode/konveyor/diff/src/foo/bar.java -> konveyor:/repo/src/foo/bar.java
    return files
      .filter((entity) => entity.isFile())
      .map((file) => path.join(file.parentPath, file.name))
      .map((path) =>
        Uri.from({
          scheme: KONVEYOR_SCHEME,
          //TODO improve path rewrite
          path: path.replace(DIFF_DIR, ""),
        })
      );
  }

  resolveKonveyorPath(uri: Uri): Uri {
    const fileUri = Uri.from({ ...uri, scheme: "file" });
    return Uri.from({
      ...fileUri,
      path: path.join(
        this.workspaceFolder.fsPath,
        workspace.asRelativePath(fileUri)
      ),
    });
  }
}
