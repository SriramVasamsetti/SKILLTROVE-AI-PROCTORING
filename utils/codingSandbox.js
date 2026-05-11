/**
 * Mock “compiler” — executes only very small safe JS snippets in a VM-like wrapper.
 * For non-JS languages, returns static analysis stub.
 */

const vm = require('vm');

const ALLOWED_LANGS = new Set(['javascript', 'js', 'node']);

function mockRun({ language, source, stdin }) {
  const lang = String(language || 'javascript').toLowerCase();
  if (!ALLOWED_LANGS.has(lang)) {
    return {
      ok: true,
      stdout: '[mock] Non-JS language: code accepted; no sandbox execution.',
      stderr: '',
      exitCode: 0,
    };
  }

  const safeSource = String(source ?? '');
  if (safeSource.length > 50_000) {
    return { ok: false, stdout: '', stderr: 'Source too large for mock runner.', exitCode: 1 };
  }

  let stdout = '';
  const sandbox = {
    console: {
      log: (...args) => {
        stdout += `${args.map(String).join(' ')}\n`;
      },
    },
    require: undefined,
    process: undefined,
    Buffer: undefined,
    setTimeout: undefined,
    setInterval: undefined,
  };

  sandbox.stdin = String(stdin ?? '');

  try {
    const wrapped = `'use strict';\n${safeSource}`;
    vm.runInNewContext(wrapped, sandbox, { timeout: 500 });
    return { ok: true, stdout: stdout.trimEnd(), stderr: '', exitCode: 0 };
  } catch (e) {
    return { ok: false, stdout: '', stderr: String(e?.message ?? e), exitCode: 1 };
  }
}

module.exports = { mockRun };
