# Contributing Guide

## Development Workflow

### 1. Testing Requirement
This project enforces a strict **Test-Driven Development (or Test-First)** policy for critical features.

**Rule:** Any new feature or bug fix must include a corresponding Playwright E2E test.

### 2. How to Add a New Feature

1.  **Implement the Feature**: Write your code in `src/`.
2.  **Add E2E Tests**:
    *   Create or update a spec file in `tests/e2e/`.
    *   Example: `tests/e2e/new-feature.spec.ts`.
3.  **Run Tests**:
    ```bash
    npm run test:e2e
    ```
4.  **Verify**: Ensure all tests pass (Green) before pushing.

### 3. Project Structure
- `src/`: Source code
- `tests/e2e/`: Playwright end-to-end tests
- `tests/unit/`: Jest unit tests

### 4. Continuous Integration
Ensure `npm run test:e2e` passes locally.
