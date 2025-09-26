// copyTemplates.js (ESM)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function copyFolder(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) copyFolder(srcPath, destPath);
        else fs.copyFileSync(srcPath, destPath);
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 패키지(배포물) 실제 위치
const pkgRoot = __dirname;

// 사용자 프로젝트 루트 추정: INIT_CWD 우선, 폴백으로 pkgRoot의 상위 탐색
const userRoot =
    process.env.INIT_CWD && !process.env.INIT_CWD.includes('node_modules')
        ? process.env.INIT_CWD
        : // node_modules/.../post-converter → 프로젝트 루트로 올라가기
        path.resolve(pkgRoot, '..', '..');

// 안전장치: 자기 자신(node_modules)으로 복사하지 않도록 방지
if (userRoot.includes('node_modules')) {
    console.warn('[post-converter] Could not resolve project root safely. Skip copying.');
    process.exit(0);
}

// 실제 복사
// profile 폴더 복사
const profileSrc = path.join(pkgRoot, 'profile');
const profileDest = path.join(userRoot, 'profile');
if (!fs.existsSync(profileDest)) {
    copyFolder(profileSrc, profileDest);
    console.log('[post-converter] Copied folder: profile');
} else {
    console.log('[post-converter] Skip folder (already exists): profile');
}

// result 폴더 복사
const resultSrc = path.join(pkgRoot, 'result');
const resultDest = path.join(userRoot, 'result');
if (!fs.existsSync(resultDest)) {
    copyFolder(resultSrc, resultDest);
    console.log('[post-converter] Copied folder: result');
} else {
    console.log('[post-converter] Skip folder (already exists): result');
}

// customTemplate.html 복사
const templateSrc = path.join(pkgRoot, 'customTemplate.html');
const templateDest = path.join(userRoot, 'customTemplate.html');
if (!fs.existsSync(templateDest)) {
    fs.copyFileSync(templateSrc, templateDest);
    console.log('[post-converter] Copied file: customTemplate.html');
} else {
    console.log('[post-converter] Skip file (already exists): customTemplate.html');
}

console.log('[post-converter] Template copy process finished.');