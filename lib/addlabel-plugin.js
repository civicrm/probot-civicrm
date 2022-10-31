const commands = require("probot-commands");
module.exports = (robot) => {
    var default_labels_list = require('./labels_data')
    commands(robot, 'label', (context, command) => {
        const labelvals = command.arguments.split(/, */);
        // var labelipjson = JSON.stringify(labelvals);
        var label_len = labelvals.length;
        context.log('label_len ' + label_len);
        var labels_list = labelvals.slice(1, label_len);

        context.log(labels); 

        if (labelvals[0] == "add") {
            // var labels = labelvals.slice(1, label_len);
            context.log(labels_list);
            var labels = [];
            for(index=0;index<labels_list.length;index++){
                if(default_labels_list.includes(labels_list[index])){
                    labels.push(labels_list[index])
                }
            }
            context.log(labels);
            return context.github.issues.addLabels(context.issue({ labels }));
        } 
        else if (labelvals[0] == "remove") {
            for (var index = 0; index < label_len; index++) {
                // context.log(labels_list);
                return context.github.issues.removeLabel(
                    context.issue({ name: labels_list[index] })
                );
            }
        }else {
            var params = context.issue({
                body:
                "Improper command please follow the syntax: /label [add/remove],label1,label2,label3"
            });
            return context.github.issues.createComment(params);
        }
    });
}
