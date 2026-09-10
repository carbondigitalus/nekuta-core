// Core Modules
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

// NPM Modules
import { ConventionalChangelog } from 'conventional-changelog';
import gulp from 'gulp';
import semver from 'semver';

export function lintStaged(done) {
    const staged = execSync('git diff --cached --name-only --diff-filter=ACM', {
        encoding: 'utf-8'
    })
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

// --- release ---------------------------------------------------------------
// Deliberately Gulp-only: no GitHub Actions/CI, no Codecov. `release` composes
// version + changelog + tag; `release:publish` is never included in it, so
// publishing an actual version to npm is always a separate, explicit step.

const RELEASABLE_PACKAGES = {
    core: { dir: 'apps/nekuta', name: '@nekuta/core' },
    next: { dir: 'apps/next', name: '@nekuta/next' },
    'eslint-plugin': {
        dir: 'apps/eslint-plugin',
        name: '@nekuta/eslint-plugin'
    }
};

function getReleaseArgs() {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        options: {
            pkg: { type: 'string' },
            type: { type: 'string' },
            preid: { type: 'string' },
            tag: { type: 'string' },
            live: { type: 'boolean', default: false }
        },
        strict: false,
        allowPositionals: true
    });
    return values;
}

function resolvePackage(pkgAlias) {
    const pkg = RELEASABLE_PACKAGES[pkgAlias];
    if (!pkg) {
        throw new Error(
            `unknown or missing --pkg "${pkgAlias ?? ''}" — expected one of: ${Object.keys(RELEASABLE_PACKAGES).join(', ')}\n` +
                'e.g. "npx gulp release:version --pkg core"'
        );
    }
    return pkg;
}

function readPackageJson(dir) {
    const file = path.resolve(dir, 'package.json');
    return { file, data: JSON.parse(readFileSync(file, 'utf-8')) };
}

function releaseVersion(done) {
    try {
        const args = getReleaseArgs();
        const pkg = resolvePackage(args.pkg);
        const { file, data } = readPackageJson(pkg.dir);
        const releaseType = args.type ?? 'patch';
        const previousVersion = data.version;
        const nextVersion = semver.inc(
            previousVersion,
            releaseType,
            args.preid
        );

        if (!nextVersion) {
            throw new Error(
                `could not increment version "${previousVersion}" with release type "${releaseType}"`
            );
        }

        data.version = nextVersion;
        writeFileSync(file, `${JSON.stringify(data, null, 4)}\n`, 'utf-8');
        console.log(`${pkg.name}: ${previousVersion} -> ${nextVersion}`);
        done();
    } catch (error) {
        done(error);
    }
}

async function releaseChangelog() {
    const args = getReleaseArgs();
    const pkg = resolvePackage(args.pkg);
    const { data } = readPackageJson(pkg.dir);
    const tagPrefix = `${pkg.name}@`;
    const changelogPath = path.resolve(pkg.dir, 'CHANGELOG.md');
    const existing = existsSync(changelogPath)
        ? readFileSync(changelogPath, 'utf-8')
        : '';

    const chunks = [];
    const changelog = new ConventionalChangelog(process.cwd())
        .loadPreset('angular')
        .readPackage(path.resolve(pkg.dir, 'package.json'))
        .tags({ prefix: tagPrefix })
        .commits({ path: pkg.dir })
        .context({ version: data.version });

    for await (const chunk of changelog.write()) {
        chunks.push(chunk);
    }

    const generated = chunks.join('').trim();
    if (!generated) {
        console.log(
            `${pkg.name}: no relevant commits since the last tag, changelog unchanged`
        );
        return;
    }

    writeFileSync(changelogPath, `${generated}\n\n${existing}`, 'utf-8');
    console.log(`${pkg.name}: wrote ${changelogPath}`);
}

function releasePublish(done) {
    try {
        const args = getReleaseArgs();
        const pkg = resolvePackage(args.pkg);
        const { data } = readPackageJson(pkg.dir);
        const live = args.live === true;
        // npm refuses to publish a prerelease version without an explicit
        // dist-tag, since it would otherwise clobber "latest" — default to
        // "next" for prereleases, "latest" for stable, overridable via --tag.
        const tag =
            args.tag ?? (semver.prerelease(data.version) ? 'next' : 'latest');

        console.log(
            `${live ? 'publishing' : 'dry-run publishing'} ${pkg.name}@${data.version} (tag: ${tag})...`
        );
        execSync(`npm publish --tag ${tag}${live ? '' : ' --dry-run'}`, {
            cwd: path.resolve(pkg.dir),
            stdio: 'inherit'
        });
        done();
    } catch (error) {
        done(error);
    }
}

function releaseTag(done) {
    try {
        const args = getReleaseArgs();
        const pkg = resolvePackage(args.pkg);
        const { data } = readPackageJson(pkg.dir);
        const tagName = `${pkg.name}@${data.version}`;

        execSync(`git tag -a "${tagName}" -m "${tagName}"`, {
            stdio: 'inherit'
        });
        console.log(
            `created local tag ${tagName} (not pushed — push manually when ready)`
        );
        done();
    } catch (error) {
        done(error);
    }
}

export {
    releaseVersion as 'release:version',
    releaseChangelog as 'release:changelog',
    releasePublish as 'release:publish',
    releaseTag as 'release:tag'
};

// version -> changelog -> tag. Publishing is intentionally excluded — it's
// the one step with an irreversible external side effect, so it always has
// to be run by hand via `gulp release:publish --pkg <alias> --live`.
export const release = gulp.series(
    releaseVersion,
    releaseChangelog,
    releaseTag
);
