import { read } from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from 'path';
import fs from 'fs';
import { dir, log } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readHtmlFragments(dirPath) {
    // 디렉토리 경로가 존재하지 않으면 return
    if (!fs.existsSync(dirPath)) return [];

    let fragments = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            fragments = fragments.concat(readHtmlFragments(fullPath));
        }
        else if (entry.isFile() && entry.name.endsWith(".html")) {
            fragments.push({
                name: path.basename(entry.name, ".html"),
                content: fs.readFileSync(fullPath, "utf-8")
            });
        }
    }

    return fragments;

}

/** 템플릿의 placeholder를 섹션별 HTML로 치환하여 result/index.html 생성 */
export function createPages(inputDir, outputDir, baseUrl) {

    const baseDir = __dirname;
    // console.log("path: " + path);
    // 템플릿 읽기
    const templatePath = path.join(baseDir, "customTemplate.html");
    // log("base: " + baseDir + "templatePath: " + templatePath);
    let template = fs.readFileSync(templatePath, "utf-8");

    // 섹션 폴더에서 조각 읽기 (result/ 기준)
    const resultDir = outputDir;

    const allFragments = readHtmlFragments(resultDir);

    for (const fragment of allFragments) {
        const regex = new RegExp(`{{\\s*${fragment.name}\\s*}}`, "g");
        template = template.replace(regex, fragment.content);
    }

    fs.writeFileSync(path.join(resultDir, "index.html"), template, "utf-8");

    console.log(`✅ Built: ${path.join(resultDir, "index.html")}`);
}