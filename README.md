# commander-zod

## Build Validated, Type-safe, CLI Tools

This is a lightweight extension for [Commander](https://www.npmjs.com/package/commander), adding a layer of validation and static typing for Typescript using [Zod](https://github.com/colinhacks/zod). Commander is one of the most prolific tools on npm, having been around for over 10 years, it is still actively maintained, and as of early March 2022 has only **4 open GitHub issues of a total 855 closed**! Now with Zod validation and Typescript support it should be even easier to build CLI tools that help standardize, automate, and improve your workflows.

## ClI Workflows

The repo includes additional packages that can be ussed together to quickly build out CLI projects for your team.

## Add a new package

Run `nx g @nrwl/react:lib my-lib` to generate a library.

> You can also use any of the plugins above to generate libraries as well.

Libraries are shareable across libraries and applications. They can be imported from `@commander-zod/mylib`.

## Development server

Run `nx serve my-app` for a dev server. Navigate to http://localhost:4200/. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `nx g @nrwl/react:component my-component --project=my-app` to generate a new component.

## Build

Run `nx build my-app` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `nx test my-app` to execute the unit tests via [Jest](https://jestjs.io).

Run `nx affected:test` to execute the unit tests affected by a change.

## Running end-to-end tests

Run `nx e2e my-app` to execute the end-to-end tests via [Cypress](https://www.cypress.io).

Run `nx affected:e2e` to execute the end-to-end tests affected by a change.

## Understand your workspace

Run `nx graph` to see a diagram of the dependencies of your projects.

## Further help

Visit the [Nx Documentation](https://nx.dev) to learn more.
