import { read } from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from 'path';
import fs from 'fs';
import { dir, log } from "console";
import { marked } from "marked";
import { prettyFormat } from "./convert.js"
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.join(process.cwd(), "result", "posting");
const templatePath = path.join(baseDir, "postDetailTemplate.html");

function readHtmlFragments(dirPath) {
    // 디렉토리 경로가 존재하지 않으면 return

    if (!fs.existsSync(dirPath)) return [];
    let fragments = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        // log("fullPath: " +fullPath);
        if (entry.isDirectory()) {
            fragments = fragments.concat(readHtmlFragments(fullPath));
        }
        else if (entry.isFile() && entry.name.endsWith(".html")) {
            const relativePath = path.relative(baseDir, fullPath);
            fragments.push({
                name: path.basename(entry.name, ".html"),
                path: `./${relativePath}`
            });
        }
    }

    return fragments;
}


function readMdFiles(readDir, writeDir, baseUrl = "") {
    const template = fs.readFileSync(templatePath, "utf-8");
    // log(templatePath);
    // log(template);


    const entries = fs.readdirSync(readDir, { withFileTypes: true });

    for (const entry of entries) {
        const fullReadPath = path.join(readDir, entry.name);

        // log("fullWritePath: " + fullWritePath);
        if (entry.isDirectory()) {
            // 하위 디렉토리 구조 그대로 writeDir에 생성
            const newWriteDir = path.join(writeDir, entry.name);
            log("new" + newWriteDir);
            if (!fs.existsSync(newWriteDir)) fs.mkdirSync(newWriteDir, { recursive: true });
            readMdFiles(fullReadPath, newWriteDir);
        }
        else if (entry.isFile() && entry.name.endsWith(".md")) {

            // const fullWritePath = path.join(writeDir, "posting");
            const fullWritePath = writeDir;
            const mdContent = fs.readFileSync(fullReadPath, "utf-8");
            const htmlContent = marked(mdContent);

            // 템플릿 치환
            const finalHtml = template.replace(/{{\s*postDetail\s*}}/g, htmlContent);
            // log(finalHtml);
            const prettyHtml = prettyFormat(finalHtml);

            // writeDir 내부에 동일한 파일명으로 저장
            const outputHtmlPath = path.join(fullWritePath, entry.name.replace(/\.md$/, ".html"));
            // log("output: " + outputHtmlPath);
            fs.writeFileSync(outputHtmlPath, prettyHtml, "utf-8");

            console.log(`✅ 변환 완료: ${fullReadPath} → ${outputHtmlPath}`);
        }
    }
}



/** 템플릿의 placeholder를 섹션별 HTML로 치환하여 result/postMainTemplate.html 에 매핑 후 postMain.html 생성 */
export function createPostPages(inputDir, outputDir, baseUrl) {
    const baseDir = __dirname;
    // console.log("path: " + path);
    // md 읽어서 html 변환 -> 템플릿과 합친 후 html 다시 덮어쓰기
    readMdFiles(inputDir, outputDir);

    const templatePath = path.join(baseDir, "result/posting/postMainTemplate.html");

    let template = fs.readFileSync(templatePath, "utf-8");

    // log("template 대체 전: " + template);
    // 섹션 폴더에서 조각 읽기 (result/posting 기준)
    const resultDir = path.join(outputDir, "posting")
    // log("outputDir: " +outputDir);
    const allFragments = readHtmlFragments(resultDir);
    let postList = "";
    for (const fragment of allFragments) {
        const href = `${fragment.path}`;
        if (fragment.name != "postMainTemplate" && fragment.name != "postMain" && fragment.name != "postDetailTemplate") {
            postList += `<a href="${href}">${fragment.name}</a><br>\n`;
        }
        // log("postList : " +postList)

    }
    template = template.replace(/{{\s*postList\s*}}/g, postList);
    // log("template 반영된 list: " + template);
    fs.writeFileSync(path.join(resultDir, "postMain.html"), template, "utf-8");
    console.log(`✅ Built: ${path.join(resultDir, "postMain.html")}`);
}
