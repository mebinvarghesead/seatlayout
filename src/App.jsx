import React from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';
import { useKeyboard } from './hooks/useKeyboard';

export default function App() {
  useKeyboard();

  return (
    <div style={styles.app}>
      <Toolbar />
      <div style={styles.workspace}>
        <Canvas />
        <PropertiesPanel />
      </div>
    </div>
  );
}

const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    background: '#0f172a',
  },
  workspace: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
};
