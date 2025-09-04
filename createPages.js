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
    // log(dirPath);
    // 디렉토리 존재할 경우에, 그 안에 있는 것들 읽기 시작
    const files = fs.readdirSync(dirPath)
        .filter(f => f.endsWith(".html")); // 디렉토리 제외하고, html로 끝나는 파일들만 필터링
    log("files: " + files); // 파일들이 여러 개 있을 수 있으므로, [] 로 저장

    // 파일 이름을 기준으로 template에다가 매핑해야 하기 때문에, name과 content 속성을 설정
    // name - html 파일의 이름
    // content - html 파일 내용물
    return files.map(f => ({
        name: path.basename(f, ".html"),
        content: fs.readFileSync(path.join(dirPath, f), "utf-8")
    }));

}

/** 템플릿의 placeholder를 섹션별 HTML로 치환하여 result/index.html 생성 */
export function createPages() {

    const baseDir = __dirname;
    console.log("path: " + path);
    // 템플릿 읽기
    const templatePath = path.join(baseDir, "customTemplate.html");
    let template = fs.readFileSync(templatePath, "utf-8");

    // 섹션 폴더에서 조각 읽기 (result/ 기준)
    const resultDir = path.join(baseDir, "result");

    // result 디렉토리 안에 있는 html 파일들 스캔
    const rootFragments = readHtmlFragments(resultDir);
    for (const fragment of rootFragments) {
        const regex = new RegExp(`{{\\s*${fragment.name}\\s*}}`, "g");
        template = template.replace(regex, fragment.content);
    }

    // result 디렉토리 안의 디렉토리들의 html 파일들 스캔
    const subDirs = fs.readdirSync(resultDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const dirName of subDirs) {
        log("dirName: " + dirName);
        const htmlFragments = readHtmlFragments(path.join(resultDir, dirName));

        for (const fragment of htmlFragments) {
            const regex = new RegExp(`{{\\s*${fragment.name}\\s*}}`, "g");
            template = template.replace(regex, fragment.content);
        }
    }

    fs.writeFileSync(path.join(resultDir, "index.html"), template, "utf-8");

    console.log(`✅ Built: ${path.join(resultDir, "index.html")}`);
}

function extractProjects(htmlString) {
    // <h3>로 시작해서 </ul>로 끝나는 블록을 모두 찾기
    const regex = /<h3[\s\S]*?<\/ul>/g;
    const matches = (htmlString.match(regex) || [])
        .map(block => `<article class="card">\n${block}\n</article>`)
        .join("\n");

    return matches;
}