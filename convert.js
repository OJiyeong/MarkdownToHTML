import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { log } from "console";
import { fileURLToPath } from "url";
import { createPostPages } from './createPostPages.js';
import { createPages } from './createPages.js';

/**
 * @param {string} inputDir - 입력 디렉토리 경로
 * @param {string} outputDir - 출력 디렉토리 경로
 * @param {string} baseUrl - 사이트 내 상대 URL 경로 (예: /about)
 * @returns {Array} 폴더/파일 구조 정보
 */
export function convert(inputDir, outputDir, baseUrl = "") {

    const result = [];
    try {
        // outputDir이 존재하지 않는 경우, 폴더 생성
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`출력 디렉토리 생성: ${outputDir}`);
        }
        const entries = fs.readdirSync(inputDir, { withFileTypes: true });

        for (const entry of entries) {
            const inputPath = path.join(inputDir, entry.name);
            const outputPath = path.join(outputDir, entry.name);
            // log("entry: "+entry.name); 
            try {
                if (entry.isDirectory()) {

                    //posting 디렉토리를 만날 경우에는 createPostPages()로 처리
                    if (entry.name === "posting") {
                        // log("posting 디렉토리 발견: " + inputPath);
                        createPostPages(inputDir, outputDir, baseUrl);
                        continue;
                    }

                    const children = convert(inputPath, outputPath, baseUrl + "/" + entry.name);
                    result.push({
                        type: "dir",
                        name: entry.name,
                        path: baseUrl + "/" + entry.name,
                        children
                    });
                } else if (entry.isFile() && entry.name.endsWith(".md")) {
                    const nameWithoutExt = entry.name.replace(/\.md$/, "");
                    result.push({
                        type: "file",
                        name: nameWithoutExt,
                        path: baseUrl + "/" + nameWithoutExt,
                        fullPath: inputPath
                    });
                }
            } catch (err) {
                console.error(`탐색 오류 발생: ${inputPath} → ${err.message} - convert.js`);
            }
        }
        result.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));

        for (const item of result) {
            if (item.type === "file") {
                try {
                    const md = fs.readFileSync(item.fullPath, "utf-8");

                    let htmlContent = marked(md);

                    //   예: href="foo.md#bar" → href="foo.html#bar"
                    htmlContent = htmlContent.replace(
                        /href="([^"]+?)\.md(\#[^"]*)?"/gi,
                        'href="$1.html$2"'
                    );

                    // 👉 HTML 코드 들여쓰기 적용
                    const prettyHtml = prettyFormat(htmlContent);



                    const finalOutputPath = path.join(outputDir, `${item.name}.html`);
                    fs.writeFileSync(finalOutputPath, prettyHtml, "utf-8");
                    console.log(`✅ 변환 완료: ${item.fullPath} → ${finalOutputPath}`);

                } catch (err) {
                    console.error(`변환 오류 발생: ${item.fullPath} → ${err.message}`);
                }
            }
        }
        if (baseUrl === "") {
            createPages(inputDir, outputDir, baseUrl);
        }

    } catch (err) {
        console.error("변환 오류 발생: ", err.message);
    }

}

export function prettyFormat(html) {
    const tokens = html
        .replace(/></g, ">\n<") // 태그 사이에 줄바꿈 삽입
        .split("\n");
    let indent = 0;
    return tokens
        .map(line => {
            if (/^<\/\w/.test(line)) {
                // 닫는 태그면 들여쓰기 감소
                indent = Math.max(indent - 2, 0);
            }
            const result = " ".repeat(indent) + line.trim();
            if (/^<\w[^>]*[^/]>$/.test(line) && !/^<br/.test(line)) {
                // 여는 태그면 들여쓰기 증가 (단, <br/> 같은 단일 태그 제외)
                indent += 2;
            }
            return result;
        })
        .join("\n");
}