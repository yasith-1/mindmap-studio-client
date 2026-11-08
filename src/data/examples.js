// Sample Markdown documents used by the "Example" button.
// Headings (#, ##, ###) become branches; nested "-" list items become leaves.

export const examples = {
  readme: `# Acme Toolkit

A lightweight utility library for building CLIs.

## Features
- Zero dependencies
- Tree-shakeable ESM build
- Works in Node and the browser

## Installation
- npm: \`npm i acme-toolkit\`
- pnpm: \`pnpm add acme-toolkit\`

## Usage
### Basic
- Import the parser
- Register your commands
- Call \`run(argv)\`

### Advanced
- Custom middleware
- Plugin hooks
- Async validators

## API
### parse()
- Returns an options object
- Throws on unknown flags

### run()
- Executes the matched command
- Resolves to an exit code

## Contributing
- Fork the repo
- Open a pull request
- Follow the style guide

## License
- MIT`,

  plan: `# Spring Boot Learning Plan

## Fundamentals
- OOP & SOLID
- Dependency Injection
- Beans & the context

## Web Layer
### REST APIs
- Controllers
- Request/response mapping
- Validation

### Security
- JWT auth
- Role-based access

## Data
- Spring Data JPA
- Flyway migrations
- Transactions

## Delivery
- Docker
- CI/CD with GitHub Actions
- Deploy to the cloud`,

  trip: `# Weekend in Kandy

## Day 1
### Morning
- Temple of the Tooth
- Riverside walk
### Evening
- Kandy Lake
- Cultural dance show

## Day 2
### Morning
- Royal Botanical Gardens
### Afternoon
- Tea factory tour
- Drive to viewpoints

## Pack
- Light rain jacket
- Comfortable shoes
- Camera`,
};

export const exampleOrder = ['readme', 'plan', 'trip'];
