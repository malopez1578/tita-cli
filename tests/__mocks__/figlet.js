// Mock for figlet
const figlet = {
  textSync: jest.fn((text, options) => `ASCII: ${text}`),
  text: jest.fn(),
  fonts: jest.fn(),
  loadFont: jest.fn()
};

module.exports = figlet;
