import {SuiteContent} from './lib/suite-content.interface';
import {TestRail} from './lib/testrail';

async function main(): Promise<any> {
    const testRail: TestRail = new TestRail({
        domain: 'testrail-test.mobilcom.de',
        projectId: 3,
        suiteId: 10,
        username: 'Eoezdemir',
        password: 'Hallo**57'
    });
    const suiteContent: SuiteContent = await testRail.getSuiteContent(3, 10);
    console.log('suiteContent:', JSON.stringify(suiteContent, undefined, 4));
    // const testCases: string[] = await testRail.getCases();
    // console.log('testCases:', testCases);
}

main();
