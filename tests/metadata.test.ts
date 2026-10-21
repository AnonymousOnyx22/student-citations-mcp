import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { tools } from "../src/tools.js";
import { VERSION } from "../src/server.js";

const read = (name: string) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const server = JSON.parse(read("server.json"));
const glama = JSON.parse(read("glama.json"));
const llms = read("llms.txt");
const readme = read("README.md");
const workflow = read(".github/workflows/ci.yml");

/** True when a version fits a range such as "^1.32.1" or "^22.12.0 || >=26.0.0". */
function fits(version: string, range: string): boolean {
  const [vmaj = 0, vmin = 0, vpat = 0] = version.split(".").map(Number);
  return range.split("||").some((clause) => {
    const m = clause.trim().match(/^(\^|>=)(\d+)\.(\d+)(?:\.(\d+))?$/);
    if (!m) return false;
    const [, op, maj, min, pat] = m;
    const cmaj = Number(maj);
    const cmin = Number(min);
    const cpat = pat === undefined ? 0 : Number(pat);
    if (op === ">=") return vmaj > cmaj || (vmaj === cmaj && vmin >= cmin);
    return vmaj === cmaj && (vmin > cmin || (vmin === cmin && vpat >= cpat));
  });
}

describe("version", () => {
  it("is the same in package.json, server.json, llms.txt and glama.json", () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(lock.version).toBe(pkg.version);
    expect(lock.packages[""].version).toBe(pkg.version);
    expect(server.version).toBe(pkg.version);
    expect(server.packages[0].version).toBe(pkg.version);
    expect(glama.version).toBe(pkg.version);
    expect(llms).toContain(`Version ${pkg.version}`);
  });

  it("is the version the server reports to clients", () => {
    expect(VERSION).toBe(pkg.version);
  });
});

describe("registry files", () => {
  it("keeps the server.json description within the registry limit", () => {
    expect(server.description.length).toBeLessThanOrEqual(100);
  });

  it("names the same package in server.json as in package.json", () => {
    expect(server.name).toBe(pkg.mcpName);
    expect(glama.name).toBe(pkg.mcpName);
    expect(server.packages[0].identifier).toBe(pkg.name);
    expect(server.packages[0].registryType).toBe("npm");
  });

  it("lists every tool the server registers, with the same description", () => {
    const listed = glama.tools.map((t: { name: string }) => t.name);
    expect(listed.sort()).toEqual(tools.map((t) => t.name).sort());
    for (const tool of tools) {
      const entry = glama.tools.find((t: { name: string }) => t.name === tool.name);
      expect(entry.description).toBe(tool.description);
      expect(llms).toContain(tool.name);
    }
  });
});

describe("dependencies", () => {
  it("keeps the lock file in step with the ranges in package.json", () => {
    expect(lock.packages[""].dependencies).toEqual(pkg.dependencies);
    expect(lock.packages[""].devDependencies).toEqual(pkg.devDependencies);
  });

  it("locks a version that fits every range in package.json", () => {
    const ranges: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const [name, range] of Object.entries(ranges)) {
      const locked = lock.packages[`node_modules/${name}`]?.version;
      expect(locked, `${name} is missing from the lock file`).toBeTruthy();
      expect(fits(locked!, range), `${name}@${locked} does not fit ${range}`).toBe(true);
    }
  });

  it("states the Node version the server needs, in the README and in package.json", () => {
    const major = Number(readme.match(/Node\.js (\d+) or newer/)?.[1]);
    expect(major).toBeGreaterThanOrEqual(20);
    expect(pkg.engines.node).toContain(String(major));
  });

  it("states a Node version the test runner accepts", () => {
    const vitest = JSON.parse(read("node_modules/vitest/package.json"));
    const stated = readme.match(/test runner needs Node\.js (\d+\.\d+)/)?.[1];
    expect(stated).toBeTruthy();
    expect(fits(stated!, vitest.engines.node), `${stated} does not fit ${vitest.engines.node}`).toBe(true);
  });
});

describe("continuous integration", () => {
  it("installs, builds and tests on a push and on a pull request", () => {
    expect(workflow).toContain("push:");
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("npm test");
  });

  it("runs the build and test scripts that package.json defines", () => {
    expect(pkg.scripts.build).toBeTruthy();
    expect(pkg.scripts.test).toBeTruthy();
  });

  it("uses a Node version the package supports", () => {
    const major = Number(workflow.match(/node-version:\s*"?(\d+)/)?.[1]);
    expect(major).toBeGreaterThanOrEqual(20);
  });
});
