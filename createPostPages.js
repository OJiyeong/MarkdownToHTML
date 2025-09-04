// createPost.js
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.join(process.cwd(), "result", "posting");

/**
 * posting 폴더 내부의 HTML 파일들을 재귀적으로 읽어서,
 * name(파일명)과 path(상대경로, 슬래시 교정됨)를 반환
 */
function readHtmlFragments(dirPath) {
    if (!fs.existsSync(dirPath)) return [];

    let fragments = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            fragments = fragments.concat(readHtmlFragments(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".html")) {
            const relativePath = path
                .relative(baseDir, fullPath)
                .replace(/\\/g, "/"); // ✅ 역슬래시 → 일반 슬래시로 변환

            fragments.push({
                name: path.basename(entry.name, ".html"),
                path: `./${relativePath}`
            });
        }
    }

    return fragments;
}

/**
 * postMain.html 템플릿을 읽어,
 * {{이름}} placeholder를 실제 HTML 경로로 치환하고 저장
 */
export function createPostPages() {
    const templatePath = path.join(baseDir, "postMain.html");
    if (!fs.existsSync(templatePath)) {
        console.error("❌ postMain.html 템플릿을 찾을 수 없습니다:", templatePath);
        return;
    }

    let template = fs.readFileSync(templatePath, "utf-8");

    // posting 폴더 내부 HTML 파일들 스캔
    const allFragments = readHtmlFragments(baseDir);
    for (const fragment of allFragments) {
        const regex = new RegExp(`{{\\s*${fragment.name}\\s*}}`, "g");
        template = template.replace(regex, fragment.path);
    }

    // 카테고리 목록 (하위 폴더명 기준)
    const categories = fs.readdirSync(baseDir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name);

    // 카테고리 JS 삽입
    template = template.replace(
        "{{categories}}",
        `<script src="./postMain.js"></script>
        <script>setupCategoryFilter(${JSON.stringify(categories)});</script>`
    );

    // 최종 저장
    fs.writeFileSync(path.join(baseDir, "postMain.html"), template, "utf-8");
    console.log("✅ Built postMain.html");
}
