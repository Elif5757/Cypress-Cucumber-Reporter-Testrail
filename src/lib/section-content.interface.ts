import {TestCase} from './test-case.interface';

export interface SectionContent {
    id: number,
    name: string;
    testCases: TestCase[];
    sections: SectionContent[];
}
