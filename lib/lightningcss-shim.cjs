const { createRequire } = require("module");

const realRequire = createRequire(__filename);

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
  "lightningcss/node/browserslistToTargets"
);
module.exports.composeVisitors = realRequire(
  "lightningcss/node/composeVisitors"
);
module.exports.Features = realRequire("lightningcss/node/flags").Features;
