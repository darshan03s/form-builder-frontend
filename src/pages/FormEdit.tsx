import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { API_BASE_URL } from '@/config';
import { useUser } from '@/hooks';
import type {
  ConditionalRules,
  Condition,
  Form,
  Operator,
  Question,
  Table,
  TableField
} from '@/types';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

const FormEdit = () => {
  const { formId } = useParams();
  const { user, loadingUser } = useUser();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<TableField[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  async function getTableFields(baseId: string, tableId: string) {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.accessToken}`
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

    console.log({ table });

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

    const supportedFields = table.fields.filter((f: TableField) => supportedTypes.includes(f.type));

    return supportedFields;
  }

  useEffect(() => {
    if (loadingUser) return;
    try {
      fetch(API_BASE_URL + `/forms/${formId}`, {
        headers: {
          'X-User-Id': user.userId
        }
      }).then(async (res) => {
        if (!res.ok) {
          toast.error('Could not fetch form');
        }
        const data = await res.json();

        if (data.error) {
          toast.error(data.error);
        }

        setForm(data.form);
        setQuestions(data.form.questions || []);

        const fields = await getTableFields(
          (data.form as Form).airtableBaseId,
          (data.form as Form).airtableTableId
        );
        setFields(fields);
      });
    } catch (error) {
      toast.error('Could not fetch form');
      console.error(error);
    }
  }, [loadingUser]);

  console.log({ fields });

  const [isNewQuestionModalOpen, setIsNewQuestionModal] = useState(false);

  const handleAddQuestion = (newQuestion: Question) => {
    setQuestions((prev) => [...prev, newQuestion]);
  };

  const saveForm = async () => {
    try {
      const res = await fetch(API_BASE_URL + `/forms/${formId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.userId
        },
        body: JSON.stringify({ questions })
      });
      if (!res.ok) {
        throw new Error('Failed to save');
      }
      toast.success('Form saved');
    } catch (error) {
      toast.error('Could not save form');
      console.error(error);
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-sm mx-auto py-2 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <span>Base ID:</span>
          <span>{form?.airtableBaseId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Table ID:</span>
          <span>{form?.airtableTableId}</span>
        </div>
        <div className="py-3 border-b flex items-center justify-between">
          <span className="font-semibold">Add questions</span>
          <div className="flex items-center gap-2">
            <Link
              to={`/form/${formId}`}
              className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
            >
              <ExternalLink size={4} />
            </Link>
            <Button size={'icon-sm'} onClick={() => setIsNewQuestionModal(true)}>
              <Plus />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {questions.map((q, i) => (
            <div key={i} className="p-2 border rounded">
              <p>
                {q.label} ({q.type}) {q.required ? '(Required)' : ''}
              </p>
              {q.conditionalRules && <p className="text-sm overflow-auto">Conditional: YES</p>}
            </div>
          ))}
        </div>
        <Button onClick={saveForm}>Save Form</Button>
      </div>
      <NewQuestionModal
        open={isNewQuestionModalOpen}
        setOpen={setIsNewQuestionModal}
        fields={fields}
        existingQuestions={questions}
        onAdd={handleAddQuestion}
      />
    </div>
  );
};

interface NewQuestionModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  fields: TableField[];
  existingQuestions: Question[];
  onAdd: (newQuestion: Question) => void;
}

const NewQuestionModal = ({
  open,
  setOpen,
  fields,
  existingQuestions,
  onAdd
}: NewQuestionModalProps) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [required, setRequired] = useState<boolean>(false);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [conditions, setConditions] = useState<Condition[]>([]);

  const [newConditionQuestionKey, setNewConditionQuestionKey] = useState<string>('');
  const [newConditionOperator, setNewConditionOperator] = useState<Operator>('equals');
  const [newConditionValue, setNewConditionValue] = useState<string>('');

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const handleFieldChange = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    setSelectedFieldId(fieldId);
    if (field) {
      setLabel(field.name);
    }
  };

  const handleAddCondition = () => {
    if (!newConditionQuestionKey || !newConditionValue) {
      return;
    }
    const newCond: Condition = {
      questionKey: newConditionQuestionKey,
      operator: newConditionOperator,
      value: newConditionValue
    };
    setConditions((prev) => [...prev, newCond]);
    setNewConditionQuestionKey('');
    setNewConditionValue('');
  };

  const handleRemoveCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddQuestion = () => {
    if (!selectedField) {
      return;
    }
    const conditionalRules: ConditionalRules | null =
      conditions.length > 0 ? { logic, conditions } : null;
    const newQuestion: Question = {
      questionKey: selectedField.id,
      airtableFieldId: selectedField.id,
      label: label || selectedField.name,
      type: selectedField.type as Question['type'],
      required,
      conditionalRules
    };
    onAdd(newQuestion);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new question</DialogTitle>
          <DialogDescription>Add new question</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <Label>Field</Label>
            <Select value={selectedFieldId} onValueChange={handleFieldChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name} ({field.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Label (optional)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={selectedField?.name}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={required} onCheckedChange={(checked) => setRequired(!!checked)} />
            <Label>Required</Label>
          </div>
          <div className="border-t pt-4">
            <Label>Conditional Logic (optional)</Label>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                {conditions.map((cond, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded">
                    <span>
                      {cond.questionKey} {cond.operator} {cond.value}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveCondition(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Select value={newConditionQuestionKey} onValueChange={setNewConditionQuestionKey}>
                  <SelectTrigger>
                    <SelectValue placeholder="Depends on question" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingQuestions.map((q) => (
                      <SelectItem key={q.questionKey} value={q.questionKey}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={newConditionOperator}
                  onValueChange={(v: string) => setNewConditionOperator(v as Operator)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="notEquals">Not equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newConditionValue}
                  onChange={(e) => setNewConditionValue(e.target.value)}
                  placeholder="Value"
                />
                <Button onClick={handleAddCondition}>Add Condition</Button>
              </div>
              <RadioGroup value={logic} onValueChange={(v: string) => setLogic(v as 'AND' | 'OR')}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="AND" id="AND" />
                  <Label htmlFor="AND">AND</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="OR" id="OR" />
                  <Label htmlFor="OR">OR</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleAddQuestion}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormEdit;
