/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProjectProvider } from './context/ProjectContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Preview } from './components/Preview';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Timeline } from './components/Timeline';

export default function App() {
  return (
    <ProjectProvider>
      <div className="flex flex-col h-screen bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans">
        <Header />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          
          <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
            <Preview />
            <Timeline />
          </div>
          
          <PropertiesPanel />
        </div>
      </div>
    </ProjectProvider>
  );
}

