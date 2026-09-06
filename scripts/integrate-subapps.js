const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

const { bumpVersion } = require('./bump-version');

try {
    // 0. Auto-bump and sync deployment version
    console.log('--- Preparing Vendor Deployment Version Metadata ---');
    const versionData = bumpVersion();
    process.env.REACT_APP_VERSION = versionData.version;
    process.env.REACT_APP_BUILD_TIME = versionData.buildTime;
    process.env.REACT_APP_GIT_COMMIT = versionData.gitCommit;
    process.env.VITE_APP_VERSION = versionData.version;
    process.env.VITE_APP_BUILD_TIME = versionData.buildTime;
    process.env.VITE_APP_GIT_COMMIT = versionData.gitCommit;

    // 1. Build main app
    console.log('--- Building main React app ---');
    execSync('npm run build:main', {
        env: {
            ...process.env,
            CI: 'false',
            REACT_APP_VERSION: versionData.version,
            REACT_APP_BUILD_TIME: versionData.buildTime,
            REACT_APP_GIT_COMMIT: versionData.gitCommit
        },
        stdio: 'inherit'
    });

    const buildPath = path.join(process.cwd(), 'build');
    if (!fs.existsSync(buildPath)) {
        throw new Error('Build directory /build not found after main React build.');
    }

    // 2. Build Sub-apps if directories exist
    const subApps = [
        { name: 'Sleeper Vendor', dir: 'sleeper-vendor', dist: 'dist', target: 'sleeper-vendor' },
        { name: 'Railpad', dir: 'railpad', dist: 'dist', target: 'railpad' }
    ];

    subApps.forEach(app => {
        const appDir = path.join(process.cwd(), app.dir);
        if (fs.existsSync(appDir)) {
            console.log(`\n--- Building ${app.name} (Vite) ---`);
            try {
                console.log(`Installing ${app.name} dependencies...`);
                execSync('npm install', { cwd: appDir, stdio: 'inherit' });

                console.log(`Executing ${app.name} build...`);
                execSync('npm run build', {
                    cwd: appDir,
                    env: {
                        ...process.env,
                        VITE_APP_VERSION: versionData.version,
                        VITE_APP_BUILD_TIME: versionData.buildTime,
                        VITE_APP_GIT_COMMIT: versionData.gitCommit
                    },
                    stdio: 'inherit'
                });

                const distPath = path.join(appDir, app.dist);
                const targetPath = path.join(buildPath, app.target);

                if (fs.existsSync(distPath)) {
                    console.log(`Copying ${app.name} build to /build/${app.target}...`);
                    copyRecursiveSync(distPath, targetPath);
                    console.log(`Successfully integrated ${app.name} into /build/${app.target}`);
                }
            } catch (err) {
                console.warn(`Warning: Could not build ${app.name}: ${err.message}`);
            }
        }
    });

    // 3. Write version.json into /build
    const buildVersionPath = path.join(buildPath, 'version.json');
    fs.writeFileSync(buildVersionPath, JSON.stringify(versionData, null, 2));
    console.log(`Synced version.json in /build: v${versionData.version} (Commit: ${versionData.gitCommit})`);

    console.log('\n✅ Vendor deployment-ready build completed successfully.');
} catch (error) {
    console.error('\nBuild failed:', error.message);
    process.exit(1);
}
