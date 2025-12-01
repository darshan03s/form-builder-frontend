import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { API_BASE_URL } from '@/config';
import { useUser } from '@/hooks';
import type { Form } from '@/types';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const MyForms = () => {
  const { loadingUser, user } = useUser();
  const [forms, setForms] = useState<Form[]>([]);

  useEffect(() => {
    if (loadingUser) return;

    try {
      fetch(API_BASE_URL + '/forms', {
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MyForms;
