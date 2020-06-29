/**
 * The autoresponder monitors for new PRs and new issues. It looks for a
 * Mustache-encoded template named ISSUE_REPLY_TEMPLATE or PR_REPLY_TEMPLATE;
 * if found, it posts comment.
 */
module.exports = (robot) => {
    var fs = require('fs')
    var path = require('path')
    var Mustache = require('mustache')
    var vars = require('./variables')(robot, path.join(path.dirname(__dirname), 'config'))
    var templates = require('./templates')(robot, path.join(path.dirname(__dirname), 'config'))

    robot.on('pull_request.opened', async context => {
        const response = await context.github.issues.listForRepo(context.repo({
            state: 'all',
            creator: context.payload.pull_request.user.login
        }));
        const countPR = response.data.filter(data => data.pull_request);
        if(countPR.length == 1){
            const template = fs.readFileSync('/Users/pritikakathuria/Desktop/civicrmdev-bot/lib/PR_NEW_REPLY_TEMPLATE.mustache.md').toString()
            if (template === null || template === '') return context.github.issues.createComment(context.issue({body: 'Template not loaded'}))
            const body = Mustache.render(template, vars.generate(context))
            return context.github.issues.createComment(context.issue({body: body}))
        }
    })

    robot.on('issues.opened', async context => {

        const template = await templates.find(context, 'ISSUE_REPLY_TEMPLATE')
        if (template === null || template === '') return
        const body = Mustache.render(template, vars.generate(context))
        return context.github.issues.createComment(context.issue({body: body}))
    })
}
