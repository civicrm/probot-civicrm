# probot-civicrm

A GitHub App built with [probot](https://github.com/probot/probot) that
integrates with `civicrm.org` services.

## Setup

```sh
# Setup environment
cp .env.example .env
vi .env

# Install dependencies
npm install

# Run the bot
npm start
```

## Tips

The [probot docs](https://probot.github.io/docs/) provide a number of useful tips on [development setup](https://probot.github.io/docs/development/), [unit testing](https://probot.github.io/docs/testing/), etc.

If you want to patch `probot-civicrm` and this is your first foray into probot, be sure to read [Developing an app](https://probot.github.io/docs/development/). It introduces a nice workflow. You can skip the code-generator ("Generating a new app") and instead clone this repo. Then proceed with the remaining setup ("Configuring a GitHub App", etal). These steps will enable you to run/develop locally with your own copy of the bot.

## Authorization

This service is primarily intended for use by approved projects in the
CiviCRM ecosystem. Consequently, there is a whitelist of repos from which
the bot accepts notifications. All other notifications are silently ignored.

See also: `config/_COMMON_/repo-authz.js`

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

## Extension Testing

The plugin `extpr` listens for pull-requests on on CiviCRM extension
projects, and it relays them to Jenkins for processing.

There are few key configuration items:


* (Environment) `JENKINS_URL` - Credentials for connecting to the Jenkins server
* (Environment) `STATUS_SECRET` - An internal config option used to generate tokens.
* (Environment) `STATUS_CRED` - When Jenkins sends back status info, it should authenticate by submitting a username:password pair.

After the PR has been tested, you may request a new test run by posting
a comment which includes this line:

```
/test
```

By default, the bot only tests PRs submitted by [collaborators](https://developer.github.com/v3/repos/collaborators/#check-if-a-user-is-a-collaborator)
on the repository. If a PR is submitted by someone who doesn't have sufficient access, a collabrator can trigger a test per above (`/test`).
(TODO: More real-world testing of this.)

## Special commands and behaviours

As part of a [GSoC project](https://github.com/civicrm/probot-civicrm/pull/4) by @kartik1000, the bot can do a few other special tricks:

* Adding a comment `/label [add|remove],[label-name]` will add/remove labels to the issue
* Referencing a Gitlab issue under `dev/xx` will make the bot add a comment to the issue (this might be missing some configurations)
* When a PR is merged, it will close the associated Gitlab issue (same as above)
