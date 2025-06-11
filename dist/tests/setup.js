"use strict";
// Test setup file
// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};
// Set test timeout
jest.setTimeout(30000);
//# sourceMappingURL=setup.js.map