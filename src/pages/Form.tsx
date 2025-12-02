import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

import {
  type ConditionalRules,
  type Form as FormType,
  type Question,
  type Table,
  type TableField
} from '@/types';
import { useUser } from '@/hooks';
import { API_BASE_URL } from '@/config';

function shouldShowQuestion(
  rules: ConditionalRules | null,
  answersSoFar: Record<string, any>
): boolean {
  if (!rules) return true;

  const { logic, conditions } = rules;
  let result = logic === 'AND';

  for (const cond of conditions) {
    const answer = answersSoFar[cond.questionKey];
    let matches = false;

    if (answer === undefined) {
      matches = false;
    } else {
      if (cond.operator === 'equals') {
        if (Array.isArray(answer)) {
          matches = answer.includes(cond.value);
        } else {
          matches = answer == cond.value;
        }
      } else if (cond.operator === 'notEquals') {
        if (Array.isArray(answer)) {
          matches = !answer.includes(cond.value);
        } else {
          matches = answer != cond.value;
        }
      } else if (cond.operator === 'contains') {
        if (typeof answer === 'string') {
          matches = answer.includes(cond.value);
        } else if (Array.isArray(answer)) {
          matches = answer.includes(cond.value);
        }
      }
    }

    if (logic === 'AND') {
      result = result && matches;
    } else {
      result = result || matches;
    }
  }

  return result;
}

async function getTableFields(
  baseId: string,
  tableId: string,
  accessToken: string
): Promise<TableField[]> {
  const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      toast.error('Sign in and try again');
    }
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.json();

  const table: Table = data.tables.find((t: Table) => t.id === tableId);

  if (!table) {
    toast.error('Table not found in this base');
    return [];
  }

  const supportedTypes = [
    'singleLineText',
    'multilineText',
    'singleSelect',
    'multipleSelects',
    'multipleAttachments'
  ];

  return table.fields.filter((f: TableField) => supportedTypes.includes(f.type));
}

const Form = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<FormType | null>(null);
  const [fields, setFields] = useState<TableField[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const { user, loadingUser } = useUser();

  useEffect(() => {
    if (loadingUser) return;
    fetch(API_BASE_URL + `/forms/${formId}`, {
      headers: {
        'X-User-Id': user.userId
      }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not fetch form');
        const data = await res.json();
        setForm(data.form);
      })
      .catch((err) => {
        toast.error('Could not fetch form');
        console.error(err);
      });
  }, [formId, loadingUser, user]);

  useEffect(() => {
    if (form && user && !loadingUser) {
      getTableFields(form.airtableBaseId, form.airtableTableId, user.accessToken)
        .then(setFields)
        .catch((err) => setError(err.message));
    }
  }, [form, user, loadingUser]);

  const toggleMultiSelect = (questionKey: string, value: string) => {
    setAnswers((prev) => {
      const current = prev[questionKey] || [];
      if (current.includes(value)) {
        return { ...prev, [questionKey]: current.filter((v: string) => v !== value) };
      } else {
        return { ...prev, [questionKey]: [...current, value] };
      }
    });
  };

  const handleChange = (questionKey: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
  };

  const handleFileChange = (questionKey: string, files: FileList | null) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: files ? Array.from(files) : [] }));
  };

  const isShown = (question: Question) => shouldShowQuestion(question.conditionalRules, answers);

  const validate = (): boolean => {
    for (const q of form?.questions || []) {
      if (!isShown(q)) continue;
      const ans = answers[q.questionKey];

      if (q.required && (ans == null || ans === '' || (Array.isArray(ans) && ans.length === 0))) {
        return false;
      }

      if (q.type === 'singleSelect' && ans) {
        const choices =
          fields.find((f) => f.id === q.airtableFieldId)?.options?.choices.map((c) => c.name) || [];
        if (!choices.includes(ans)) return false;
      }

      if (q.type === 'multipleSelects' && ans) {
        if (!Array.isArray(ans)) return false;
        const choices =
          fields.find((f) => f.id === q.airtableFieldId)?.options?.choices.map((c) => c.name) || [];
        if (!ans.every((a) => choices.includes(a))) return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      alert('Please fill all required fields correctly');
      return;
    }

    const formData = new FormData();

    Object.entries(answers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0 && value[0] instanceof File) {
          value.forEach((file) => formData.append(key, file));
        } else {
          value.forEach((v) => formData.append(key, v));
        }
      } else {
        formData.append(key, value);
      }
    });

    try {
      const response = await fetch(`${API_BASE_URL}/forms/${formId}/submit`, {
        method: 'POST',
        headers: {
          'X-User-Id': user.userId
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      const data = await response.json();
      toast.success('Form submitted successfully!');
      console.log('Submission response:', data);
    } catch (error) {
      toast.error('Failed to submit form');
      console.error(error);
    }
  };

  if (!user) return <div className="py-8 text-center">Please log in to fill the form</div>;
  if (error || !form) return <div className="py-8 text-center">{error || 'Form not found'}</div>;

  return (
    <div className="form-container py-8 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {form.questions.map((q) => {
          if (!isShown(q)) return null;

          const value = answers[q.questionKey];
          const questionField = fields.find((f) => f.id === q.airtableFieldId);

          return (
            <div key={q.questionKey} className="space-y-3">
              <Label htmlFor={q.questionKey}>
                {q.label}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </Label>

              {q.type === 'singleLineText' && (
                <Input
                  id={q.questionKey}
                  value={value || ''}
                  onChange={(e) => handleChange(q.questionKey, e.target.value)}
                />
              )}

              {q.type === 'multilineText' && (
                <Textarea
                  id={q.questionKey}
                  value={value || ''}
                  onChange={(e) => handleChange(q.questionKey, e.target.value)}
                  rows={5}
                />
              )}

              {q.type === 'singleSelect' && (
                <Select
                  value={value || ''}
                  onValueChange={(val) => handleChange(q.questionKey, val)}
                >
                  <SelectTrigger id={q.questionKey}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionField?.options?.choices.map((choice) => (
                      <SelectItem key={choice.id} value={choice.name}>
                        {choice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {q.type === 'multipleSelects' && (
                <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                  {questionField?.options?.choices.map((choice) => {
                    const checked = Array.isArray(value) && value.includes(choice.name);
                    return (
                      <div key={choice.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${q.questionKey}-${choice.id}`}
                          checked={checked}
                          onCheckedChange={() => toggleMultiSelect(q.questionKey, choice.name)}
                        />
                        <label
                          htmlFor={`${q.questionKey}-${choice.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {choice.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'multipleAttachments' && (
                <Input
                  id={q.questionKey}
                  type="file"
                  multiple
                  onChange={(e) => handleFileChange(q.questionKey, e.target.files)}
                />
              )}
            </div>
          );
        })}

        <div className="pt-6">
          <Button type="submit" size="lg">
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Form;
