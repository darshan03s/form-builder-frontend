import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useUser } from '@/hooks';
import type { Form } from '@/types';
import { ExternalLink, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const MyForms = () => {
  const { loadingUser, user } = useUser();
  const [forms, setForms] = useState<Form[]>([]);

  useEffect(() => {
    if (loadingUser) return;

    try {
      fetch(import.meta.env.API_BASE_URL + '/forms', {
        headers: {
          'X-User-Id': user.userId
        }
      })
        .then(async (res) => {
          if (!res.ok) {
            toast.error('Could not fetch all forms');
          }

          const data = await res.json();

          if (data.error) {
            toast.error(data.error);
          }

          setForms(data.forms);
        })
        .catch((e) => {
          toast.error('Could not fetch all forms');
          console.error(e);
        });
    } catch (e) {
      toast.error('Could not fetch all forms');
      console.error(e);
    }
  }, [loadingUser]);

  return (
    <div>
      <Table className="max-w-xl mx-auto py-2">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">Form ID</TableHead>
            <TableHead className="text-center">Base ID</TableHead>
            <TableHead className="text-center">Table ID</TableHead>
            <TableHead className="text-center">See</TableHead>
            <TableHead className="text-center">Responses</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map((form) => (
            <TableRow key={form._id}>
              <TableCell className="text-center">
                <Link to={`/form/${form._id}/edit`}>{form._id}</Link>
              </TableCell>
              <TableCell className="font-medium text-center">{form.airtableBaseId}</TableCell>
              <TableCell className="text-center">{form.airtableTableId}</TableCell>
              <TableCell className="text-center">
                <Link to={`/form/${form._id}`} className="flex items-center justify-center">
                  <Eye className="size-4" />
                </Link>
              </TableCell>
              <TableCell className="text-center">
                <Link
                  to={`/form/${form._id}/responses`}
                  className="flex items-center justify-center"
                >
                  <ExternalLink className="size-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MyForms;
