import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useUser } from '@/hooks';
import type { Base, Table } from '@/types';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface CreateFormModalProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const CreateFormModal = ({ open, setOpen }: CreateFormModalProps) => {
  const { user, loadingUser } = useUser();
  const [bases, setBases] = useState<Base[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<{ baseId: string; tableId: string }>({
    baseId: '',
    tableId: ''
  });
  const navigate = useNavigate();

  async function getUserBases() {
    const response = await fetch('https://api.airtable.com/v0/meta/bases', {
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

    return {
      bases: data.bases.map((base: Base) => ({
        id: base.id,
        name: base.name
      }))
    };
  }

  async function getUserTables(baseId: string) {
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

    return {
      // @ts-expect-error any
      tables: data.tables.map((table) => ({
        id: table.id,
        name: table.name
      }))
    };
  }

  useEffect(() => {
    if (loadingUser) return;

    getUserBases()
      .then((result) => {
        setBases(result!.bases);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [loadingUser]);

  function handleSelectBase(val: string) {
    setSelectedOptions((s) => ({ ...s, baseId: val }));
    getUserTables(val)
      .then((result) => {
        setTables(result!.tables);
      })
      .catch((err) => {
        setError(err.message);
      });
  }

  async function handleCreateForm() {
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.userId
        },
        body: JSON.stringify(selectedOptions)
      });

      if (!res.ok) {
        toast.error('Could not create form');
      }

      const data = await res.json();

      if (!data.formId) {
        toast.error('Could not create form');
        return;
      }

      navigate(`/form/${data.formId}/edit`);
    } catch (error) {
      toast.error('Could not create form');
      console.error(error);
    } finally {
      setOpen(false);
    }
  }

  if (loading) return <p>Loading your Airtable bases...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new form</DialogTitle>
          <DialogDescription>Create new form from base and table</DialogDescription>
        </DialogHeader>
        <div className="content flex flex-col gap-4">
          <div className="select-base">
            <Select onValueChange={(val) => handleSelectBase(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select base" />
              </SelectTrigger>

              <SelectContent>
                {bases.map((base) => (
                  <SelectItem key={base.id} value={base.id}>
                    {base.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="select-table">
            <Select
              disabled={selectedOptions.baseId.length === 0}
              onValueChange={(val) => setSelectedOptions((s) => ({ ...s, tableId: val }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select table" />
              </SelectTrigger>

              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreateForm}
            disabled={selectedOptions.baseId.length === 0 || selectedOptions.tableId.length === 0}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Home = () => {
  const [isCreateFormModalOpen, setIsCreateFormModalOpen] = useState(false);

  return (
    <>
      <div className="h-full overflow-y-auto flex justify-center items-center">
        <Button onClick={() => setIsCreateFormModalOpen(true)}>Create new form</Button>
      </div>

      <CreateFormModal open={isCreateFormModalOpen} setOpen={setIsCreateFormModalOpen} />
    </>
  );
};

export default Home;
