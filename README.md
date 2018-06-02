# probot-civicrm

A GitHub App built with [probot](https://github.com/probot/probot) that
integrates with `civicrm.org` services.

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Testing

```
npm test
```

## Autoresponse: Templates

The bot will automatically post a comment when someone opens a pull-request
or issue in Github. The comment is in a [Markdown](https://guides.github.com/features/mastering-markdown/) file which may include
[Mustache](https://mustache.github.io/) variables.

For example, in each subscribed repo, you can create files like these:

* `.github/ISSUE_REPLY_TEMPLATE.mustache.md`
* `.github/PR_REPLY_TEMPLATE.mustache.md`

If you want to manage the templates in a centralized fashion, you can
create templates inside this bot's `config` folder:

* `config/:owner/:repo/:template`
* `config/:owner/_COMMON_/:template`
* `config/_COMMON_/:template`

Templates from the most specific folder will take precedence.

> NOTE: For civicrm.org, some templates are copied to multiple repos.
> After updating `civicrm-core/PR_REPLY_TEMPLATE.mustache.md`, rn
> `./update-config-copies.sh` to update the others.

## Autoresponse: Variables

A number of variables are defined by default (as appropriate to the event):

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

For example, on repos that participate in `civicrm.org`'s
continuous-integration, these variables are also available:

* `{{ci.test_host}}`
* `{{ci.browse_test_url}}`

Variables from the most specific folder will take precedence.
