import {TestCase} from './test-case.interface';
import {SectionContent} from './section-content.interface';

export interface SuiteContent {
    testCases: TestCase[];
    sections: SectionContent[];
}
