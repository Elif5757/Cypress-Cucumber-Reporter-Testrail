import {SuiteContent} from './suite-content.interface';

const axios = require('axios');
const chalk = require('chalk');
import {TestRailOptions, TestRailResult} from './testrail.interface';
import {TestCase} from './test-case.interface';
import {Section} from './section.interface';
import {SectionContent} from './section-content.interface';

export class TestRail {
    private base: String;
    private runId: Number;
    private includeAll: Boolean = true;
    private caseIds: Number[] = [];
    private caseTitel: String[] = [];
    private test_id: number;
    private custom_step_results: String[] = []

    constructor(private options: TestRailOptions) {
        this.base = `https://${options.domain}/index.php?/api/v2`;
    }

    public getCases() {
        return axios({
            method: 'get',
            url: `${this.base}/get_cases/${this.options.projectId}`,
            headers: {'Content-Type': 'application/json'},
            auth: {
                username: this.options.username,
                password: this.options.password
            },
            params: {
                suite_id: this.options.suiteId,
            }
        })
            .then(response => response.data.map(item => item))
            .catch(error => console.error(error));
    }

    public async createRun(name: string, description: string) {
        if (this.options.includeAllInTestRun === false) {
            this.includeAll = false;
            this.caseTitel = await this.getCases();
        }
        axios({
            method: 'post',
            url: `${this.base}/add_run/${this.options.projectId}`,
            headers: {'Content-Type': 'application/json'},
            auth: {
                username: this.options.username,
                password: this.options.password,
            },
            data: JSON.stringify({
                suite_id: this.options.suiteId,
                name,
                description,
                include_all: this.includeAll
                //cadeID?
            }),
        })
            .then(response => {
                this.runId = response.data.id;
            })
            .catch(error => console.error(error));
    }

    public deleteRun() {
        axios({
            method: 'post',
            url: `${this.base}/delete_run/${this.runId}`,
            headers: {'Content-Type': 'application/json'},
            auth: {
                username: this.options.username,
                password: this.options.password,
            },
        }).catch(error => console.error(error));
    }

    public publishResults(results: TestRailResult[]) {
        return axios({
            method: 'post',
            url: `${this.base}/add_result/${this.test_id}`,
            headers: {'Content-Type': 'application/json'},
            auth: {
                username: this.options.username,
                password: this.options.password,
            },
            data: JSON.stringify({ results }),
        })
            .then(response => {
                console.log('\n', chalk.magenta.underline.bold('(TestRail Reporter)'));
                console.log(
                    '\n',
                    ` - Results are published to ${chalk.magenta(
                        `https://${this.options.domain}/index.php?/runs/view/${this.runId}`
                    )}`,
                    '\n'
                );
            })
            .catch(error => console.error(error));
    }

    public closeRun() {
        axios({
            method: 'post',
            url: `${this.base}/close_run/${this.runId}`,
            headers: {'Content-Type': 'application/json'},
            auth: {
                username: this.options.username,
                password: this.options.password,
            },
        })
            .then(() => console.log('- Test run closed successfully'))
            .catch(error => console.error(error));
    }

    async getSuiteContent(projectId: number, suiteid: number): Promise<SuiteContent> {
        const casesPromise: Promise<TestCase[]> = axios({
            method: 'get',
            url: `${this.base}/get_cases/${this.options.projectId}`,
            headers: {'Content-Type': 'application/json'},
            auth: {
                username: this.options.username,
                password: this.options.password
            },
            params: {
                suite_id: this.options.suiteId,
            }
        })
            .then(response => response.data.map(item => item));
        const sectionsPromise: Promise<Section[]> = axios({
            method: 'get',
            url: `${this.base}/get_sections/project_id=${projectId}&suite_id=${suiteid}`,
            headers: {'Content-Type': 'application/json'},
            auth: {
                username: this.options.username,
                password: this.options.password
            }
        })
            .then(response => response.data.map(item => item));

        const cases = await casesPromise;
        const sections = await sectionsPromise;

        return this.buildSuiteContent(cases, sections);
    }

    private buildSuiteContent(cases: TestCase[], sections: Section[]): SuiteContent {
        // const sArray = [
        //     {
        //         id: 123,
        //         name: 'sectionname',
        //         parent: null,
        //     },
        //     {
        //         id: 4545,
        //         name: 'asfdasfdsf',
        //         parent: 123
        //     }
        // ]
        // const sbid = {
        //     123: {
        //         id: 123,
        //         name: 'sectionname',
        //         parent: null,
        //     },
        //     4545: {
        //         id: 4545,
        //         name: 'asfdasfdsf',
        //         parent: 123
        //     }
        // }
        const result: SuiteContent = {
            sections: [],
            testCases: []
        }
        const sectionsById: {[id: number]: Section} = {};
        sections.forEach((section) => {
            sectionsById[section.id] = section;
        });
        sections.forEach((section) => {
            if (section.parent_id) {

            }
        })
        cases.forEach((testCase) => {
            if (testCase.section_id) {

            } else {
                result.testCases.push(testCase);
            }
        })
        return result;
    }
}
