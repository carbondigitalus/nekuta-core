import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const COMMIT_MESSAGE_PATTERN =
    /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(\(.+\))?: .{1,72}/;

export function verifyCommit(done) {
    const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf-8' }).trim();
    const message = readFileSync(path.resolve(gitDir, 'COMMIT_EDITMSG'), 'utf-8').trim();

    if (!COMMIT_MESSAGE_PATTERN.test(message)) {
        done(
            new Error(
                `invalid commit message: "${message}"\n\n` +
                    'Commit messages must follow the Conventional Commits format, e.g.:\n\n' +
                    '  feat: add disableRoot option\n' +
                    '  fix(store): handle keep-alive with aborted navigations (close #28)\n'
            )
        );
        return;
    }

    done();
}

export function lintStaged(done) {
    const staged = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' })
        .trim()
        .split('\n')
        .filter((file) => /\.(ts|tsx|js|jsx|json|md)$/.test(file));

    if (staged.length === 0) {
        done();
        return;
    }

    const files = staged.map((file) => `"${file}"`).join(' ');
    execSync(`npx prettier --write ${files}`, { stdio: 'inherit' });
    execSync(`git add ${files}`, { stdio: 'inherit' });
    done();
}
