import fs from "node:fs";

const path = "src/worker.js";
let source = fs.readFileSync(path, "utf8");

const malformedWriter = /const passwordHash = `pbkdf2-sha256\$\{PASSWORD_HASH_ITERATIONS\}\$\{await derivePasswordHash\(password, salt\)\}`;/g;
const fixedWriter = 'const passwordHash = `pbkdf2-sha256$${PASSWORD_HASH_ITERATIONS}$${await derivePasswordHash(password, salt)}`;';
const writerCount = (source.match(malformedWriter) || []).length;
if (writerCount > 0) source = source.replace(malformedWriter, fixedWriter);

fs.writeFileSync(path, source);
console.log(`Password hash writer repair complete; corrected ${writerCount} malformed writer(s).`);
