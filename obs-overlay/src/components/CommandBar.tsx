import styled from 'styled-components';

const Bar = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: white;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const Command = styled.span`
  margin: 0 10px;
`;

const CommandBar: React.FC = () => {
  return (
    <Bar>
      <Command>!TASK</Command>
      <Command>!EDIT</Command>
      <Command>!CHECK</Command>
      <Command>!DONE</Command>
    </Bar>
  );
};

export default CommandBar;
