import { useTaskConnection } from './hooks/use-task-connection';
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
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          zIndex: 2000,
        }}>
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
