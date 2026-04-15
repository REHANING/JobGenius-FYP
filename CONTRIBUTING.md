# Contributing to JobGenius

Thank you for your interest in contributing to JobGenius! This document provides guidelines for getting involved in the project.

## 🎯 Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest new features
- 📝 Improve documentation
- 🔧 Fix bugs and implement features
- 🧪 Improve test coverage
- 🎨 Improve UI/UX

## 🚀 Getting Started

### 1. Fork the Repository
```bash
git clone https://github.com/yourusername/JobGenius-FYP.git
cd JobGenius-FYP
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Set Up Development Environment
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Create backend .env
cp backend/.env.example backend/.env

# Seed test data
cd backend && npm run seed && cd ..

# Start servers
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm run dev
```

## 📋 Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (no logic changes)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples
```bash
git commit -m "feat(auth): add Google OAuth login"
git commit -m "fix(resume): fix PDF parsing error"
git commit -m "docs(readme): update installation steps"
```

## 🔄 Pull Request Process

### Before Submitting
1. ✅ Test your changes locally
2. ✅ Update documentation if needed
3. ✅ Follow code style guidelines
4. ✅ Ensure no console errors
5. ✅ Test on both desktop and mobile (if UI changes)

### Submit PR
1. Push to your fork
2. Create Pull Request with clear description
3. Link any related issues
4. Wait for review and feedback

### PR Title Format
```
[Type] Short description

Examples:
[Feature] Add resume download functionality
[Bug Fix] Fix modal closing issue
[Docs] Update API documentation
```

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Testing Done
- [ ] Tested locally
- [ ] Tested on mobile
- [ ] All tests pass

## Related Issues
Closes #123

## Screenshots (if UI changes)
[Add screenshots here]
```

## 💻 Code Style Guide

### JavaScript/TypeScript
```typescript
// Use const/let, not var
const name = 'value';

// Use arrow functions
const handleClick = () => {
  // logic
};

// Use descriptive names
const calculateTotalPrice = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// Add JSDoc comments
/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

### React Components
```typescript
// Use functional components with hooks
const MyComponent: React.FC<Props> = ({ title, onClick }) => {
  const [state, setState] = useState(false);

  useEffect(() => {
    // Side effects
  }, []);

  return (
    <div className="component">
      <h1>{title}</h1>
    </div>
  );
};

export default MyComponent;
```

## 📁 Project Structure Guidelines

- Keep components focused and single-responsibility
- Use meaningful file names
- Group related files in folders
- Add index.ts for easier imports
- Comment complex logic

## 🧪 Testing

### Run Tests
```bash
# Frontend linting
npm run lint

# Run specific test
npm test -- specific-test.spec.ts
```

### Write Tests For
- Complex business logic
- Edge cases
- Error handling
- API integration

## 📚 Documentation

### Update These When Making Changes
- README.md (if user-facing)
- Comments in code (for complex logic)
- API documentation (for backend changes)
- Type definitions (for TypeScript)

## 🐛 Bug Report Template

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows/Mac/Linux
- Browser: Chrome/Firefox/Safari
- Version: [if applicable]

## Screenshots
[Add screenshots if helpful]
```

## 🎁 Feature Request Template

```markdown
## Summary
Brief description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this work?

## Additional Context
Any other information?
```

## ⚠️ Code Review Standards

When reviewing code, check for:
- ✅ Follows project conventions
- ✅ No console.log or debug code
- ✅ Proper error handling
- ✅ Type safety (TypeScript)
- ✅ Security concerns
- ✅ Performance issues
- ✅ Tests included
- ✅ Documentation updated

## 🚫 What NOT to Do

- ❌ Don't push to main/master directly
- ❌ Don't commit .env files
- ❌ Don't use console.log in production code
- ❌ Don't commit node_modules
- ❌ Don't make unrelated changes in one PR
- ❌ Don't ignore linting errors

## 📞 Questions or Need Help?

- 💬 Open a GitHub Discussion
- 🐛 Create an Issue
- 📧 Email: rehanahmed1208@gmail.com
- 💡 Start a Discussion tab

## 📜 License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

## 🙏 Thank You

Thank you for helping make JobGenius better! Your contributions are greatly appreciated.

---

**Happy Contributing! 🚀**

For more details, see the main [README.md](README.md)
