const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getGitCommitSha() {
    try {
        return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch (e) {
        return (
            (process.env.VERCEL_GIT_COMMIT_SHA && process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)) ||
            (process.env.GITHUB_SHA && process.env.GITHUB_SHA.slice(0, 7)) ||
            'dev'
        );
    }
}

function getCommitCount() {
    try {
        const count = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
        const parsed = parseInt(count, 10);
        if (!isNaN(parsed) && parsed > 0) {
            return parsed;
        }
    } catch (e) {}
    return null;
}

/**
 * Reads or calculates the version dynamically based on git commit count,
 * guaranteeing every single deployment produces a strictly newer semantic version (e.g. 1.2.20 -> 1.2.21 -> 1.2.22).
 */
function bumpVersion() {
    const versionFilePath = path.join(__dirname, '..', 'public', 'version.json');
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    
    let buildTime = new Date().toISOString();
    let gitCommit = getGitCommitSha();
    let currentVersion = '1.2.20';
    if (fs.existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            if (pkg.version) currentVersion = pkg.version;
        } catch (e) {}
    } else if (fs.existsSync(versionFilePath)) {
        try {
            const data = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
            if (data.version) currentVersion = data.version;
        } catch (e) {}
    }

    const commitCount = getCommitCount();
    // Offset 395: commit 415 -> 1.2.20, commit 416 -> 1.2.21, etc.
    if (commitCount && commitCount > 395) {
        const patch = commitCount - 395;
        newVersion = `1.2.${patch}`;
    } else {
        // Fallback for shallow clone in CI/CD environments (e.g. Vercel)
        const parts = currentVersion.split('.');
        if (parts.length >= 3) {
            const major = parts[0];
            const minor = parts[1];
            const patch = parseInt(parts[2], 10) || 0;
            newVersion = `${major}.${minor}.${patch + 1}`;
        } else {
            newVersion = currentVersion;
        }
    }

    const newVersionData = {
        version: newVersion,
        buildTime: buildTime,
        gitCommit: gitCommit
    };

    // 1. Write back to public/version.json
    fs.writeFileSync(versionFilePath, JSON.stringify(newVersionData, null, 2));

    // 2. Also keep package.json version in sync if possible
    if (fs.existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            pkg.version = newVersion;
            fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
        } catch (e) {
            // Ignore package.json sync error
        }
    }

    console.log(`🚀 Version auto-incremented to: ${newVersion} (Commit: ${gitCommit}, BuildTime: ${buildTime})`);

    return newVersionData;
}

if (require.main === module) {
    bumpVersion();
}

module.exports = { bumpVersion, getGitCommitSha };
