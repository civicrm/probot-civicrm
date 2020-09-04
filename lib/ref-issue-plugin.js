module.exports = (robot) => {
    robot.on('pull_request.opened', async context => {
        const pull_request = context.payload.pull_request
        var title = pull_request.title
        title = title.toString()
        title = title.toLowerCase()
        title = title.toString().split(" ").join("")
        console.log(title)
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
            ref_link = 'The issue associated with the Pull Request can be viewed at ' + ref_link

            var project_ids = require('./project_id.js');
            const { Gitlab } = require('@gitbeaker/node');
            const api = new Gitlab({
                host: process.env.GITLAB_URL,
                token: process.env.GITLAB_TOKEN,
            });
            // 70 is project id for core, 1888 is issue number
            if(link_head in project_ids){
                api.Issues.show(project_ids[link_head], link_number).then((issue) => {
                    console.log(pull_request.html_url)
                    var string_link = 'A pull request related to this issue has been opened '
                    string_link = string_link.link(pull_request.html_url)
                    console.log(pull_request.title)
                    var pull_request_link = string_link + ' with the title: ' + pull_request.title
                    api.IssueDiscussions.create(project_ids[link_head],link_number,pull_request_link).then((comment) => {
                        console.log(comment)
                    }).catch(error => {
                        console.log(error)
                    })
                    return context.github.issues.createComment(context.issue({body: ref_link}))
                }). catch( error => {
                    return context.github.issues.createComment(context.issue({body: 'No issue was found matching the number given in the pull request title. Please check the issue number.'}))
                })
            }
            else{
                return context.github.issues.createComment(context.issue({body: 'No issue was found matching the issue reference given in the pull request title. Please check the syntax.'}))
                return;
            }
            
        }
    })
}
