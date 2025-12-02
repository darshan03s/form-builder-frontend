import { useParams } from 'react-router-dom';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/hooks';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface ResponseItem {
  submissionId: string;
  airtableRecordId: string;
  createdAt: string;
  status: string;
  answersPreview: string;
  answers: Record<string, string>;
}

const FormResponses = () => {
  const { formId } = useParams<{ formId: string }>();
  const { user, loadingUser } = useUser();
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnswersModalOpen, setIsAnswersModalOpen] = useState(false);

  useEffect(() => {
    if (loadingUser || !formId) return;

    fetch(`${import.meta.env.VITE_API_BASE_URL}/forms/${formId}/responses`, {
      headers: {
        'X-User-Id': user.userId
      }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load responses');
        const data = await res.json();
        setResponses(data.responses || []);
      })
      .catch((err) => {
        toast.error('Could not load responses');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [formId, user.userId, loadingUser]);

  if (loading) {
    return <div className="py-8 text-center">Loading responses...</div>;
  }

  if (responses.length === 0) {
    return <div className="py-8 text-center">No responses yet.</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Form Responses</h1>
      <Table>
        <TableCaption>A list of all submissions stored in your database.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Submission ID</TableHead>
            <TableHead>Airtable Record ID</TableHead>
            <TableHead>Submitted At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="max-w-md">Answers Preview</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {responses.map((r) => (
            <TableRow key={r.submissionId}>
              <TableCell className="font-mono text-xs">{r.submissionId}</TableCell>
              <TableCell className="font-mono text-xs">{r.airtableRecordId}</TableCell>
              <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant={r.status === 'Active' ? 'default' : 'destructive'}>
                  {r.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button onClick={() => setIsAnswersModalOpen(true)} variant={'outline'}>
                  <Eye size={4} />
                </Button>
                <AnswersModal
                  open={isAnswersModalOpen}
                  setOpen={setIsAnswersModalOpen}
                  data={r.answers}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

interface AnswersModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  data: Record<string, string>;
}

const AnswersModal = ({ open, setOpen, data }: AnswersModalProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Response</DialogTitle>
          <DialogDescription>Response from user</DialogDescription>
        </DialogHeader>
        <div className="answers">
          {Object.entries(data).map(([key, value]) => {
            return (
              <div key={key} className="flex flex-col gap-1">
                {typeof value === 'string' && <span>{value}</span>}
                {Array.isArray(value) && value.every((v) => typeof v === 'string') && (
                  <div className="flex flex-wrap gap-2">
                    {value.map((v, i) => (
                      <span key={i}>{v}</span>
                    ))}
                  </div>
                )}
                {Array.isArray(value) && value.every((v) => typeof v === 'object' && v.url) && (
                  <div className="flex flex-col gap-2">
                    {value.map((file, i) => (
                      <a
                        key={i}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        View file {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormResponses;
