## auto-git-pull

Quick and dirty project to automatically run `git pull` in parent directory.
This is setup to listen for the incoming webhook POST from github when origin main is updated.

Tunneled through ngrok.

### How to use
1. Download this project to a sub-directory of the project you wish to keep updated. For example, we like to use the following structure
```
main_repo
  .sync
  [...main_repo_files]
```
1. Make sure you add `**/.sync` to your `.gitignore` file
1. Keep this app running (call `start.vbs` from startup);