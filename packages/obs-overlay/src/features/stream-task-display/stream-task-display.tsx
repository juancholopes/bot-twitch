import { useTaskConnectionSupabase as useTaskConnection } from './hooks/use-task-connection-supabase';
import CompactTaskList from './components/CompactTaskList';

/**
 * Stream Task Display Feature
 * 
 * Displays live task list for stream overlay.
 * Updates in real-time via WebSocket connection.
 */
const StreamTaskDisplay: React.FC = () => {
  const { tasks, loading, error, connected } = useTaskConnection();

  return (
    <>
      {error && (
        <div className="fixed right-5 top-5 z-[2000] rounded-lg bg-[rgba(239,68,68,0.9)] px-4 py-3 text-white">
          {error}
        </div>
      )}
      <CompactTaskList 
        tasks={tasks} 
        loading={loading}
        connected={connected}
      />
    </>
  );
};

export default StreamTaskDisplay;
