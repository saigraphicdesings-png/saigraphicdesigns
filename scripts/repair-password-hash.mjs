import fs from "node:fs";

const path = "src/worker.js";
let source = fs.readFileSync(path, "utf8");

const writer = 'const passwordHash = `pbkdf2-sha256${PASSWORD_HASH_ITERATIONS}${await derivePasswordHash(password, salt)}`;';
const writerFixed = 'const passwordHash = `pbkdf2-sha256$${PASSWORD_HASH_ITERATIONS}$${await derivePasswordHash(password, salt)}`;';
const writerCount = source.split(writer).length - 1;
if (writerCount === 2) {
  source = source.replaceAll(writer, writerFixed);
} else if (writerCount !== 0) {
  throw new Error(`Expected 0 or 2 malformed password-hash writers, found ${writerCount}`);
}

const loginStart = source.indexOf('  const stored = String(customer.password_hash);');
const loginEndMarker = '  if (candidate !== (versioned ? versioned[2] : stored)) return json({ error: "Invalid email or password." }, 401);';
const loginEnd = source.indexOf(loginEndMarker, loginStart);
if (loginStart < 0 || loginEnd < 0) {
  throw new Error("Expected login password validation block was not found");
}

const loginFixed = `  const stored = String(customer.password_hash);\n  const versioned = /^pbkdf2-sha256\\$(100000)\\$([A-Za-z0-9+/]{43}=)$/.exec(stored);\n  const malformedVersioned = /^pbkdf2-sha256100000([A-Za-z0-9+/]{43}=)$/.exec(stored);\n  // Older unversioned hashes were written with 120,000 iterations. Never silently\n  // reinterpret those hashes as the new 100,000-iteration format.\n  const unversioned = /^[A-Za-z0-9+/]{43}=$/.test(stored);\n  if (!versioned && !malformedVersioned && !unversioned) {\n    return json({ error: "Invalid email or password." }, 401);\n  }\n\n  const iterations = versioned || malformedVersioned ? PASSWORD_HASH_ITERATIONS : 120000;\n  const expectedHash = versioned ? versioned[2] : malformedVersioned ? malformedVersioned[1] : stored;\n  let candidate;\n  try {\n    candidate = await derivePasswordHash(password, base64ToBytes(customer.password_salt), iterations);\n  } catch (error) {\n    if (unversioned && error.name === "NotSupportedError") {\n      return json({ error: "Please use Forgot Password to reset this account's password before signing in.", code: "PASSWORD_RESET_REQUIRED" }, 409);\n    }\n    throw error;\n  }\n  if (candidate !== expectedHash) return json({ error: "Invalid email or password." }, 401);\n\n  // Migrate hashes produced by the old malformed formatter after a successful login.\n  if (malformedVersioned) {\n    const migratedHash = \`pbkdf2-sha256$\${PASSWORD_HASH_ITERATIONS}$\${candidate}\`;\n    await env.DB.prepare("UPDATE customer_accounts SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")\n      .bind(migratedHash, customer.id)\n      .run();\n  }`;

const replacementEnd = loginEnd + loginEndMarker.length;
source = source.slice(0, loginStart) + loginFixed + source.slice(replacementEnd);

fs.writeFileSync(path, source);
console.log("Password hash format repaired: signup/reset writers fixed; login accepts and migrates malformed 100,000-iteration hashes.");
