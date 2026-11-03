
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const lock = path.join(process.cwd(), '.next-dev.lock');
const token = randomUUID();
const payload = JSON.stringify({
    pid: process.pid,
    token
});

function release() {
    try {
        if (
            fs.existsSync(lock) &&
            fs.readFileSync(lock, 'utf8') === payload
        ) {
            fs.unlinkSync(lock);
        }
    } catch (error) {
        console.error('Lock cleanup warning:', error.message);
    }
}

function isProcessRunning(pid) {
    if (!Number.isInteger(pid) || pid <= 0) {
        return false;
    }

    if (process.platform === 'win32') {
        try {
            const result = spawnSync(
                'tasklist.exe',
                ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'],
                {
                    encoding: 'utf8',
                    windowsHide: true
                }
            );

            if (result.error || result.status !== 0) {
                return true;
            }

            return Boolean(
                result.stdout &&
                result.stdout.trim() &&
                !result.stdout.toLowerCase().includes('no tasks are running')
            );
        } catch {
            return true;
        }
    }

    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        if (error.code === 'ESRCH') {
            return false;
        }

        if (error.code === 'EPERM') {
            return true;
        }

        throw error;
    }
}

function acquireLock() {
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            fs.writeFileSync(lock, payload, {
                flag: 'wx'
            });

            return true;
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }

            let old;

            try {
                old = JSON.parse(
                    fs.readFileSync(lock, 'utf8')
                );
            } catch (readError) {
                console.error(
                    'Unable to read development lock.'
                );
                return false;
            }

            if (isProcessRunning(old.pid)) {
                console.error(
                    'A development process may already be running.'
                );
                console.error(
                    'Existing process PID:', old.pid
                );
                console.error(
                    'Close the existing server before restarting.'
                );

                return false;
            }

            try {
                fs.unlinkSync(lock);
            } catch (removeError) {
                if (removeError.code !== 'ENOENT') {
                    console.error(
                        'Unable to remove stale lock:',
                        removeError.message
                    );
                    return false;
                }
            }
        }
    }

    return false;
}

if (!acquireLock()) {
    process.exit(1);
}

process.on('exit', release);

const nextPath = path.join(
    process.cwd(),
    'node_modules',
    'next',
    'dist',
    'bin',
    'next'
);

if (!fs.existsSync(nextPath)) {
    console.error(
        'Next.js installation not found. Run npm install.'
    );
    process.exit(1);
}

const child = spawn(
    process.execPath,
    [
        nextPath,
        'dev',
        ...process.argv.slice(2)
    ],
    {
        stdio: 'inherit',
        windowsHide: true
    }
);

let shuttingDown = false;

function shutdown(signal) {
    if (shuttingDown) return;

    shuttingDown = true;

    if (child.pid && child.exitCode === null) {
        try {
            child.kill(signal);
        } catch (error) {
            console.error(
                'Unable to stop child process:',
                error.message
            );
        }
    } else {
        process.exit(0);
    }
}

process.on('SIGINT', () => {
    shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    shutdown('SIGTERM');
});

child.on('error', error => {
    console.error(
        'Could not start Next.js:',
        error.message
    );

    process.exitCode = 1;
});

child.on('exit', (code, signal) => {
    if (signal && code === null) {
        process.exit(0);
    } else {
        process.exit(code ?? 1);
    }
});
