// Mock for ora
const ora = jest.fn((options) => {
  const spinner = {
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
    warn: jest.fn().mockReturnThis(),
    info: jest.fn().mockReturnThis(),
    text: '',
    color: 'cyan',
    isSpinning: false
  };
  
  if (typeof options === 'string') {
    spinner.text = options;
  } else if (options && options.text) {
    spinner.text = options.text;
  }
  
  return spinner;
});

module.exports = ora;
