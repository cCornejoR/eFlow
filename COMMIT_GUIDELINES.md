# Commit Guidelines for eFlow

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages.

### Structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scopes (optional)

- **frontend**: Changes to React/TypeScript frontend
- **backend**: Changes to Python backend
- **tauri**: Changes to Tauri configuration
- **ui**: User interface changes
- **api**: API related changes
- **config**: Configuration changes

### Examples

#### Good commit messages:

```
feat(frontend): add HDF5 file tree viewer component

fix(backend): resolve file path handling on Windows

docs: update README with installation instructions

style(ui): improve button hover states with TailwindCSS

refactor(api): simplify file processing logic

chore(deps): update Tauri to latest version
```

#### Bad commit messages:

```
fix stuff
update
changes
wip
asdf
```

### Rules

1. Use the imperative mood in the subject line ("add" not "added" or "adds")
2. Do not end the subject line with a period
3. Capitalize the subject line
4. Limit the subject line to 50 characters
5. Separate subject from body with a blank line
6. Use the body to explain what and why vs. how
7. Wrap the body at 72 characters

### Breaking Changes

If your commit introduces breaking changes, add `BREAKING CHANGE:` in the footer:

```
feat(api)!: change file processing API

BREAKING CHANGE: The file processing API now requires authentication tokens
```

### Branch Naming

- **feature/**: New features (`feature/hdf5-viewer`)
- **fix/**: Bug fixes (`fix/file-path-windows`)
- **docs/**: Documentation (`docs/update-readme`)
- **refactor/**: Code refactoring (`refactor/api-cleanup`)
- **chore/**: Maintenance (`chore/update-deps`)

### Pull Request Guidelines

1. Use descriptive titles that explain the change
2. Reference related issues with `Fixes #123` or `Closes #123`
3. Include screenshots for UI changes
4. Ensure all tests pass
5. Update documentation if needed

## Pre-commit Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Documentation is updated if needed
- [ ] Commit message follows guidelines
- [ ] No sensitive information in commit
- [ ] Build succeeds without warnings
