const commands = require("probot-commands");
module.exports = (robot) => {
    robot.on('issue_comment.created', async context => {
        const pull_request = context.payload.issue
        var title = pull_request.title
        title = title.toString()
        title = title.toLowerCase()
        title = title.toString().split(" ").join("")
        commands(robot, 'close', (context, command) => {
            console.log(title);
            if(title.slice(0,3) == 'dev'){
                string_index=4;
                while(string_index<title.length && title[string_index] != '#'){
                    string_index += 1;
                }
                var link_head = title.slice(4,string_index)
                if(string_index == title.length){
                    return;
                }
                var issue_number_index = string_index+1;
                while(issue_number_index<title.length && title[issue_number_index]-'0'>=0 && title[issue_number_index]-'0'<=9){
                    issue_number_index += 1
                }
                var link_number = title.slice(string_index+1,issue_number_index)
                var ref_link = 'https://lab.civicrm.org/dev' + '/' + link_head + '/-/issues/' + link_number
                ref_link = 'The issue assosciated with the Pull Request can be viewed on this link ' + ref_link
                console.log(link_number)
                const { Gitlab } = require('@gitbeaker/node');
                const api = new Gitlab({
                    host: 'https://lab.civicrm.org',
                    token: '',
                });
                var project_ids = require('./project_id.js');
                if(link_head in project_ids){
                    api.Issues.show(project_ids[link_head], link_number).then((issue) => {
                        console.log(issue)
                        api.Issues.remove(project_ids[link_head],link_number).then((comment) => {
                           console.log(comment);
                           return context.github.issues.createComment(context.issue({body: 'The issue has been succesfully closed'}))
                        }).catch(error => {
                            console.log(error)
                        })
                    }). catch( error => {
                        return context.github.issues.createComment(context.issue({body: 'No issue was found matching the issue reference given in the pull request title. Please check the syntax.'}))
                    })
                }
                else{
                    return context.github.issues.createComment(context.issue({body: 'No issue was found matching the issue reference given in the pull request title. Please check the syntax.'}))
                    return;
                }
            }
        });
    });
}
