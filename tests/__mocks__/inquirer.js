// Mock for inquirer
const inquirer = {
  prompt: jest.fn().mockResolvedValue({}),
  createPromptModule: jest.fn()
};

module.exports = inquirer;
