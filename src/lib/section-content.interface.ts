import {TestCase} from './test-case.interface';

export interface SectionContent {
    testCases: TestCase[];
    sections: SectionContent[];
}
