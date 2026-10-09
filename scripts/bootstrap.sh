#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
task_root="$PWD"
task_version="$(tr -d '\r\n' < .node-version)"
task_free_kib="$(df -Pk "$task_root" | awk 'NR==2 {print $4}')"
if [ "$task_free_kib" -lt 524288 ]; then echo 'Bootstrap needs at least 512 MiB available on the project volume' >&2; exit 2; fi
mkdir -p .codex-work/cache/runtime .codex-work/cache/npm .codex-work/cache/pnpm
if [ "$(node --version 2>/dev/null || true)" != "v$task_version" ] || [ "${FOCUS_FORCE_PROJECT_NODE:-0}" = 1 ]; then
  case "$(uname -s)" in Darwin) task_os=darwin ;; Linux) task_os=linux ;; *) exit 2 ;; esac
  case "$(uname -m)" in arm64|aarch64) task_arch=arm64 ;; x86_64) task_arch=x64 ;; *) exit 2 ;; esac
  task_dist="node-v$task_version-$task_os-$task_arch"
  task_cache="$task_root/.codex-work/cache/runtime"
  if [ ! -x "$task_cache/$task_dist/bin/node" ] || [ ! -f "$task_cache/$task_dist/.focus-installed" ]; then
    curl --fail --location --retry 2 "https://nodejs.org/dist/v$task_version/$task_dist.tar.gz" -o "$task_cache/$task_dist.tar.gz"
    curl --fail --location --retry 2 "https://nodejs.org/dist/v$task_version/SHASUMS256.txt" -o "$task_cache/SHASUMS256.txt"
    task_expected="$(awk -v f="$task_dist.tar.gz" '$2==f {print $1}' "$task_cache/SHASUMS256.txt")"
    task_actual="$(shasum -a 256 "$task_cache/$task_dist.tar.gz" | awk '{print $1}')"
    [ -n "$task_expected" ] && [ "$task_actual" = "$task_expected" ]
    tar --no-same-owner -xzf "$task_cache/$task_dist.tar.gz" -C "$task_cache"
    [ "$("$task_cache/$task_dist/bin/node" --version)" = "v$task_version" ]
    printf '%s\n' "$task_actual" > "$task_cache/$task_dist/.focus-installed"
  fi
  export PATH="$task_cache/$task_dist/bin:$PATH"
fi
export npm_config_cache="$task_root/.codex-work/cache/npm"
if [ "$(pnpm --version 2>/dev/null || true)" = "10.18.3" ]; then
  task_pnpm=(pnpm)
else
  task_pnpm=(npm exec --yes --package=pnpm@10.18.3 -- pnpm)
fi
"${task_pnpm[@]}" install --store-dir "$task_root/.codex-work/cache/pnpm" ${FOCUS_INSTALL_FLAGS:---frozen-lockfile}
"${task_pnpm[@]}" build
if [ "$#" -gt 0 ]; then "${task_pnpm[@]}" "$@"; fi
