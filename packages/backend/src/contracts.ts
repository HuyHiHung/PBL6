export type Catalog={courses:Array<{id:string;title:string;catalog_version:string;topics:Array<{id:string;title:string;assessment_id:string|null;lessons:Array<{id:string;title:string;position:number;is_preview:boolean}>}>}>};
export type LessonInfo={id:string;topic_id:string;course_id:string;title:string;assessment_id:string;revision_id:string};
export type SnapshotItem={question_id:string;question_revision_id:string;lesson_id:string;position:number;public_snapshot:Record<string,unknown>;answer_snapshot:Record<string,unknown>;explanation:string;transcript:string|null};
export type AssessmentSnapshot={id:string;revision_id:string;kind:'quiz'|'topic_test';lesson_id:string|null;topic_id:string;course_id:string;title:string;passing_percent:number;grading_policy_version:number;items:SnapshotItem[]};
export type Availability={available:boolean};
export type VocabularySnapshot={vocabulary_id:string;lesson_id:string;topic_id:string;course_id:string;snapshot:{word:string;meaning:string;example:string;phonetic?:string|null;audio_asset_id?:string|null}};
