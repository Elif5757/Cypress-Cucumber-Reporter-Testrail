import {TestRail} from './lib/testrail';
import {TestRailOptions} from './lib/testrail.interface';
import {SuiteContent} from './lib/suite-content.interface';

async function main(): Promise<any> {
    const testRail: TestRail = new TestRail({
        domain: 'testrail-test.mobilcom.de',
        projectId: 3,
        suiteId: 10,
        username: 'Eoezdemir',
        password: 'Hallo**57'
    });
    const suiteContent: SuiteContent = await testRail.getSuiteContent(3, 10);
    const testCases: string[] = await testRail.getCases();
    console.log('testCases:', testCases);

}

main();
