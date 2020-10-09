import {SectionContent} from './section-content.interface';
import {Section} from './section.interface';
import {SuiteContent} from './suite-content.interface';
import {TestCase} from './test-case.interface';
import {TestRailOptions, TestRailResult} from './testrail.interface';

const axios = require('axios');
const chalk = require('chalk');

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

    private gitHubAcc() {
        return  {
            headers: {'Content-Type': 'application/json'},
            auth: {
                username: this.options.username,
                password: this.options.password
            }
        }
    }

    public getCases() {
        return axios({
            method: 'get',
            url: `${this.base}/get_cases/${this.options.projectId}`,
            ...this.gitHubAcc(),
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
            ...this.gitHubAcc(),
            data: JSON.stringify({
                suite_id: this.options.suiteId,
                name,
                description,
                include_all: this.includeAll
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
            ...this.gitHubAcc(),
        }).catch(error => console.error(error));
    }

    public publishResults(results: TestRailResult[]) {
        return axios({
            method: 'post',
            url: `${this.base}/add_result/${this.test_id}`,
            ...this.gitHubAcc(),
            data: JSON.stringify({results}),
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
            ...this.gitHubAcc(),
        })
            .then(() => console.log('- Test run closed successfully'))
            .catch(error => console.error(error));
    }

    public async getSuiteContent(projectId: number, suiteId: number): Promise<SuiteContent> {
        // für die axios-Aufrufe sollte eine Hilfsmethode geschrieben werden,
        // damit man nicht jedes Mal die Auth-Daten und den Content-Type-Header übergeben muss.
        const testCasesPromise: Promise<TestCase[]> = axios({
            method: 'get',
            url: `${this.base}/get_cases/${this.options.projectId}`,
            ...this.gitHubAcc(),
            params: {
                suite_id: this.options.suiteId,
            }
        }).then(response => response.data);
        const sectionsPromise: Promise<Section[]> = axios({
            method: 'get',
            url: `${this.base}/get_sections/${projectId}`,
            ...this.gitHubAcc(),
            params: {
                suite_id: suiteId,
            }
        }).then(response => response.data);

        const testCases = await testCasesPromise;
        const sections = await sectionsPromise;

        return TestRail.buildSuiteContent(sections, testCases);
    }

    public static buildSuiteContent(sections: Section[], testCases: TestCase[]): SuiteContent {
        // 2. SuiteContent-Objekt aufbauen
        const suiteContent: SuiteContent = {
            sections: [],
            testCases: []
        };
        // 2.1. Für das spätere Hinzufügen der Testfälle wird hier zusätzlich
        //      zur schnellen Suche der Sections eine Lookup-Table aufgebaut
        const sectionContentMap: { [id: number]: SectionContent } = {};

        // 2.2. Das Sections-Array wird durchlaufen. Für jede Section wird anhand der Parent-IDs
        //      der Pfad von der aktuellen Section bis zur Suite-Ebene ermittelt.
        //      Anschließend werden alle Pfad-Elemente dem `suiteContent` hinzugefügt.
        //      Zusätzlich wird noch die Map aus 2.1 befüllt.
        sections.forEach((section) => {
            const sectionPath = TestRail.getSectionPath(sections, section.id);
            let resultSections = suiteContent.sections;
            sectionPath.forEach((sectionPathItem) => {
                let resultSectionItem = resultSections.find((s) => s.id === sectionPathItem.id);
                if (!resultSectionItem) {
                    resultSectionItem = {
                        id: sectionPathItem.id,
                        name: sectionPathItem.name,
                        sections: [],
                        testCases: []
                    };
                    sectionContentMap[resultSectionItem.id] = resultSectionItem;
                    resultSections.push(resultSectionItem);
                }
                resultSections = resultSectionItem.sections;
            });
        });

        // 3. Bislang enthält `suiteContent` nur SectionContents.
        //    Diese werden jetzt mit den Testfällen angereichert.
        testCases.forEach((testCase) => {
            (testCase.section_id ? sectionContentMap[testCase.section_id] : suiteContent).testCases.push(testCase);
        });

        return suiteContent;
    }

    private static getSectionPath(sections: Section[], sectionId: number): Section[] {
        const result: Section[] = [];
        while (sectionId) {
            const section = sections.find((section) => section.id === sectionId);
            if (!section) {
                throw `Fehler beim Auflösen des Section-Paths: SectionId ${sectionId} existiert nicht`
            }
            result.unshift(section);
            sectionId = section.parent_id;
        }
        return result;
    }

}
