export interface Base {
  id: string;
  name: string;
}

export interface Table {
  id: string;
  name: string;
  description: string;
  fields: TableField[];
}

export interface TableField {
  id: string;
  name: string;
  type: string;
}

export interface Form {
  _id: string;
  airtableBaseId: string;
  airtableTableId: string;
  createdAt: string;
  owner: string;
  questions: unknown[];
}

export type Operator = 'equals' | 'notEquals' | 'contains';

export interface Condition {
  questionKey: string;
  operator: Operator;
  // @ts-expect-error any
  value;
}

export interface ConditionalRules {
  logic: 'AND' | 'OR';
  conditions: Condition[];
}

export type QuestionType =
  | 'singleLineText'
  | 'multilineText'
  | 'singleSelect'
  | 'multipleSelects'
  | 'multipleAttachments';

export interface Question {
  questionKey: string;
  airtableFieldId: string;
  label: string;
  type: QuestionType;
  required: boolean;
  conditionalRules: ConditionalRules | null;
}
