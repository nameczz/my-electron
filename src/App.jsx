import React from "react";
import HashRouter from './Router';
import { DataManagementProvider } from './context/data-management'
import { SystemProvider } from './context/system'
import { HttpProvider } from './context/http'
import { MaterialProvider } from './context/material'
import "./app.less";
import "./assets/scss/reset.less"

/**
 *  SystemProvider will always on top. The currenAddress means selected milvus ip.
 *  So the other context data must like:
 *  {
 *    '127.0.0.1:19121': {...data},
 *    '127.0.0.1:19122': {...data},
 *  }
 *  
 *  Then we can get current data by currenAddress!
 *  The currenAddress also need store in localstorage for http context to use it.
 */
export default function App() {
  return (
    <MaterialProvider>
      <HttpProvider>
        <SystemProvider>
          <DataManagementProvider>
            <HashRouter></HashRouter>
          </DataManagementProvider>
        </SystemProvider>
      </HttpProvider>
    </MaterialProvider>
  );
}
