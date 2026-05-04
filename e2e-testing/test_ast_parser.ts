import * as parser from "@babel/parser";
import * as fs from "fs";

try {
    // Read the raw React/TS code passed from Python via standard input
    const code: string = fs.readFileSync(0, 'utf-8');
    
    // Parse it into an AST, specifically enabling TypeScript and JSX (React) rules
    const ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx"]
    });
    
    // Spit it back out as a gorgeous JSON string
    console.log(JSON.stringify(ast, null, 2));
} catch (e: unknown) {
    if (e instanceof Error) {
        console.error(`Parse Error: ${e.message}`);
    } else {
        console.error("Parse Error: An unknown error occurred.");
    }
    process.exit(1);
}