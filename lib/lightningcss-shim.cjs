const path = require("path");
const { createRequire } = require("module");

const realRequire = createRequire(__filename);
const lightningcssEntry = realRequire.resolve("lightningcss");
const lightningcssNodeDir = path.dirname(lightningcssEntry);

function resolveNative() {
  if (process.env.CSS_TRANSFORMER_WASM) {
    return realRequire("lightningcss/pkg");
  }

  const parts = [process.platform, process.arch];

  if (process.platform === "linux") {
    const { MUSL, familySync } = realRequire("detect-libc");
    const family = familySync();

    if (family === MUSL) {
      parts.push("musl");
    } else if (process.arch === "arm") {
      parts.push("gnueabihf");
    } else {
      parts.push("gnu");
    }
  } else if (process.platform === "win32") {
    parts.push("msvc");
  }

  return realRequire(`lightningcss-${parts.join("-")}`);
}

let native;

try {
  native = resolveNative();
} catch (error) {
  const message = error && error.message ? error.message : String(error);
  throw new Error(`Failed to load lightningcss native bindings: ${message}`);
}

module.exports = native;
module.exports.browserslistToTargets = realRequire(
  path.join(lightningcssNodeDir, "browserslistToTargets")
);
module.exports.composeVisitors = realRequire(
  path.join(lightningcssNodeDir, "composeVisitors")
);
module.exports.Features = realRequire(
  path.join(lightningcssNodeDir, "flags")
).Features;
