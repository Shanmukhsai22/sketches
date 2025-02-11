import { useRouter } from 'next/router';
import { NotebookEditor } from '@/components/Notebook/NotebookEditor';

export default function NotebookPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div>
      <NotebookEditor notebookId={id as string} />
    </div>
  );
}