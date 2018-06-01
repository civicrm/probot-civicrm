# probot-civicrm-autoresponder

> a GitHub App built with [probot](https://github.com/probot/probot) that 

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Templates

In each subscribed repo, you can create files like these:

* `.github/ISSUE_REPLY_TEMPLATE.mustache.md`
* `.github/PR_REPLY_TEMPLATE.mustache.md`

Additionally, inside this bot's repo, you create the same template files:

* `./config/:owner/:repo/:template`
* `./config/:owner/_COMMON_/:template`
* `./config/_COMMON_/:template`

Templates from the most specific folder will take precedence.

## Variables

Some variables are defined by default (as appropriate to the event):

 * `{{issue.number}}`
 * `{{pull_request.number}}`
 * `{{pull_request.base.label}}`
 * `{{pull_request.base.ref}}`
 * `{{pull_request.base.repo.name}}`
 * `{{pull_request.base.repo.full_name}}`
 * `{{pull_request.head.label}}`
 * `{{pull_request.head.ref}}`
 * `{{pull_request.head.repo.name}}`
 * `{{pull_request.head.repo.full_name}}`
 * `{{repository.owner.login}}`
 * `{{repository.name}}`
 * `{{repository.full_name}}`

Additionally, you may create `variables.js` plugins in any of these locations:

* `./config/:owner/:repo/variables.js`
* `./config/:owner/_COMMON_/variables.js`
* `./config/_COMMON_/variables.js`

Variables from the most specific folder will take precedence.
