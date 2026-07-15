# Setting up your Development Environment

## Install NVM/Node/NPM
Download NVM (if you don't have it)
```shell
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```
Now either close your shell and open a new one or reload your shell.

```shell
source ~/.bashrc
```
or if you use zsh
```shell
source ~/.zshrc
```
Verify
```shell
nvm --version 
> 0.39.7
```


## Install Node via nvm
At the root of the project run:
```shell
nvm install
nvm use
node -v
> v20.x.x.x
npm -v
> 10.x.x
```

## Install TypeScript tooling
```shell
npm install -D typescript ts-node-dev @types/node @types/express
```

## Git Setup
1. Install Git
2. Generate SSH key
3. Add key to GitHub
4. Clone repository

