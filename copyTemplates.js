import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function copyFolder(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyFolder(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = process.cwd();

copyFolder(path.join(__dirname, 'profile'), path.join(root, 'profile'));
copyFolder(path.join(__dirname, 'result'), path.join(root, 'result'));
fs.copyFileSync(path.join(__dirname, 'customTemplate.html'), path.join(root, 'customTemplate.html'));

console.log('Template files copied to project root!');
