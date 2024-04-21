/* eslint-disable no-console */
import { exec } from "node:child_process";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { promisify } from "node:util";
import { prerelease, valid } from "semver";

const execCmd = promisify(exec);

const packagePath = process.cwd();

const distPath = path.join(packagePath, "./dist");

void (async () => {
  const distPackagePath = path.join(distPath, "package.json");

  const packageJSON = JSON.parse(
    await fs.readFile(distPackagePath, "utf-8"),
  ) as Record<string, unknown>;

  if (!packageJSON.version) {
    console.error("No `version` property found.");
    process.exit(1);
  }

  const version = valid(packageJSON.version as string);

  if (!version) {
    console.error("The `version` property isn't valid.");
    process.exit(1);
  }

  const prereleaseComponents = prerelease(version);
  const channel = (prereleaseComponents?.[0] ?? "latest") as string;

  const { stderr, stdout } = await execCmd(
    `npm publish ./dist/ --tag ${channel}`,
  );

  console.log({ stdout });
  console.error({ stderr });
})();
