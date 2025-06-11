// Mock for chalk
const chalk = {
  red: (text) => text,
  green: (text) => text,
  blue: (text) => text,
  yellow: (text) => text,
  cyan: (text) => text,
  gray: (text) => text,
  grey: (text) => text,
  magenta: (text) => text,
  white: (text) => text,
  black: (text) => text,
  bold: (text) => text,
  dim: (text) => text,
  italic: (text) => text,
  underline: (text) => text,
  strikethrough: (text) => text
};

// Support both default and named exports
module.exports = chalk;
module.exports.default = chalk;
