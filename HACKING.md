# Hacking

This explains how to develop locally, build the app & package the lib.

## Development

Best way to develop is with vite hot-reloading:

```sh
npm run dev
```

## Build microsite

Run the production build:

```sh
npm run build
```

## Package the library

```
npm run prepare # or npm pack to see the .tgz
```

or alternatively, publish it:

```
npm publish
```

#### Deploying with GitHub Pages

The [GitHub Actions](https://github.com/features/actions) workflow defined in
`.github/workflows/ci.yml` automates the deployment to
[GitHub Pages](https://pages.github.com/). Make sure you have GitHub Pages
enabled for your repository (Settings -> Pages -> Source -> GitHub Actions)
<p align="center">
  <img width="400" alt="GitHub Pages" src="https://github.com/user-attachments/assets/ef5765ab-86fe-41ef-b44b-a9d0a59771f3">
</p>
