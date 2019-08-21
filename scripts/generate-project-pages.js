const Octokit = require('@octokit/rest')
var fs = require('fs');

var org = 'eclipse-ee4j';

const octokit = Octokit({
    auth: ''
});

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

async function getProjectData() {
    var projects = [];

    var repositories = (await octokit.repos.listForOrg({
        org: org,
        per_page: 100 // TODO: handle multipage
    })).data;

    await asyncForEach(repositories, async (repository) => {
        var project = {};
        project.contributors = [];

        var values = await Promise.all([
            octokit.repos.getReadme({ owner: org, repo: repository.name }).catch(p =>'No README'),
            octokit.licenses.getForRepo({ owner: org, repo: repository.name }).catch(p => 'No license')]);
       
        var readme = '';
        var readmeExtension = '';
        if(values[0].data) {
            readme = new Buffer(values[0].data.content, 'base64').toString('utf8');
            var readmeName = values[0].data.name;
            readmeExtension = readmeName.substr(readmeName.lastIndexOf(".") + 1 , readmeName.length);
        }
        var license = values[1].data ? values[1].data.license.name : '';

        project.name = repository.name;
        project.description = repository.description;
        project.text = readme;
        project.textFormat = readmeExtension;
        project.license = license;
        projects.push(project);
    });

    return projects;
}

const start = async () => {
    var projects = await getProjectData();
    console.log(projects);
}

start()
